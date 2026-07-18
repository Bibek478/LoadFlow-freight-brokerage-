# Library Docs

Project-specific usage patterns for every third-party library. Read the relevant section before implementing a feature that touches it.

---

## Mongoose

### Connection Singleton

```typescript
// lib/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

let cached = (global as any).mongoose ?? { conn: null, promise: null };
(global as any).mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

Call `await connectDB()` at the top of every route handler before any model query. Never instantiate a new connection anywhere else.

### Model Files (`lib/models/`)

Each model file exports a Mongoose model using `mongoose.models.X ?? mongoose.model('X', schema)` to survive hot-reload in Next.js dev mode.

Example — `lib/models/Load.ts`:

```typescript
import mongoose, { Schema } from "mongoose";

const StatusHistorySchema = new Schema({
  fromStatus: { type: String, default: null },
  toStatus:   { type: String, required: true },
  changedByUserId: { type: Schema.Types.ObjectId, required: true },
  changedAt:  { type: Date, default: Date.now },
  note:       { type: String, default: null },
}, { _id: false });

const RateConfirmationSchema = new Schema({
  version:           { type: Number, required: true },
  baseRate:          { type: Number, required: true },
  accessorials:      [{ description: String, amount: Number }],
  totalRate:         { type: Number, required: true },
  confirmedByUserId: { type: Schema.Types.ObjectId, required: true },
  confirmedAt:       { type: Date, default: Date.now },
  isCurrent:         { type: Boolean, default: true },
}, { _id: false });

const LoadSchema = new Schema({
  brokerOrgId:          { type: Schema.Types.ObjectId, required: true },
  shipperId:            { type: Schema.Types.ObjectId, required: true },
  carrierOrgId:         { type: Schema.Types.ObjectId, default: null },
  status:               { type: String, required: true, default: "POSTED" },
  origin:               { type: String, required: true },
  destination:          { type: String, required: true },
  commodityType:        { type: String, required: true },
  equipmentType:        { type: String, required: true },
  pickupDate:           { type: Date, required: true },
  deliveryDate:         { type: Date, default: null },
  complianceFlagged:    { type: Boolean, default: false },
  complianceFlagReason: { type: String, default: null },
  podUrl:               { type: String, default: null },
  statusHistory:        [StatusHistorySchema],
  rateConfirmations:    [RateConfirmationSchema],
}, { timestamps: true });

export const Load = mongoose.models.Load ?? mongoose.model("Load", LoadSchema);
```

### Status Change + Audit Entry (single atomic document write)

```typescript
await Load.findOneAndUpdate(
  { _id: loadId },
  {
    $set:  { status: newStatus, updatedAt: new Date() },
    $push: {
      statusHistory: {
        fromStatus: oldStatus,
        toStatus: newStatus,
        changedByUserId: user.id,
        changedAt: new Date(),
      },
    },
  },
  { new: true }
);
```

This is atomic at the document level — no session/transaction needed. Never write a status change without the `$push statusHistory` in the same update.

### Rate Confirmation Versioning

```typescript
// Mark all existing confirmations as not current
await Load.findOneAndUpdate(
  { _id: loadId },
  { $set: { "rateConfirmations.$[].isCurrent": false } }
);
const load = await Load.findById(loadId).lean();
const version = (load!.rateConfirmations?.length ?? 0) + 1;
await Load.findOneAndUpdate(
  { _id: loadId },
  {
    $push: {
      rateConfirmations: {
        version,
        baseRate,
        accessorials,
        totalRate,
        confirmedByUserId: user.id,
        confirmedAt: new Date(),
        isCurrent: true,
      },
    },
  },
  { new: true }
);
```

Never mutate an existing `rateConfirmations` entry's `baseRate`/`accessorials` — insert-only semantics still apply.

### Cross-Collection Atomicity (signup: Org + User together)

```typescript
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  const org = await Org.create([{ type, name }], { session });
  await User.create([{ orgId: org[0]._id, orgType: type, ...rest }], { session });
});
session.endSession();
```

Use a session only when two separate collections must succeed or fail together. The Load document's embedded arrays handle everything else without a session.

### Carrier org-ID validation (replacing FK constraints)

Before writing `carrierOrgId` onto a Load, always validate:

```typescript
const carrier = await Org.findById(carrierOrgId).lean();
if (!carrier || carrier.type !== "CARRIER") {
  return NextResponse.json({ success: false, error: "Invalid carrier" }, { status: 400 });
}
```

Never trust an ID from the request body without this check — this is the code-level referential integrity that replaces Postgres foreign keys.

---

## Auth (bcryptjs + jose)

```typescript
// lib/auth.ts
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
  (await cookies()).set("session", token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
```

**SessionPayload shape** (what goes in the JWT — kept small, this is what every RBAC check reads):

```typescript
type SessionUser = {
  id: string;
  orgId: string | null;
  orgType: "BROKER" | "CARRIER" | "SHIPPER";
  isOrgAdmin: boolean;
  permissions: Permission[]; // resolved from role_id at login time, baked into the token
};
```

Resolving permissions at login and baking them into the JWT (rather than querying the DB on every request) is the right tradeoff here — it means a role change doesn't take effect until the affected user logs in again, which is an acceptable limitation to state explicitly in the walkthrough, not a bug to fix under time pressure.

**Rules:**
- Never store plaintext passwords, never log a password or a password hash
- Never put anything in the JWT payload beyond what's listed above — no need for more, and less surface area for bugs

---

## Vercel Blob (stretch — POD upload only)

```typescript
import { put } from "@vercel/blob";

const blob = await put(`pod/${loadId}.pdf`, file, { access: "public" });
// blob.url → save to Load.pod_url
```

Server-side only, called from `app/api/loads/[id]/pod/route.ts`. Requires `pod.upload` permission. Only build this after all must-haves are deployed and working.
