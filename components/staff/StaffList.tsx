"use client";

interface StaffMember {
    _id: string;
    name: string;
    email: string;
    roleName: string | null;
    createdAt: string;
}

interface StaffListProps {
    staff: StaffMember[];
}

export default function StaffList({ staff }: StaffListProps) {
    if (staff.length === 0) {
        return (
            <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                No staff members yet. Add one below.
            </p>
        );
    }

    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        {["Name", "Email", "Role", "Added"].map((h) => (
                            <th
                                key={h}
                                style={{
                                    textAlign: "left",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    textTransform: "uppercase",
                                    color: "var(--color-text-secondary)",
                                    padding: "8px 12px",
                                    borderBottom: "1px solid var(--color-border)",
                                }}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {staff.map((s) => (
                        <tr
                            key={s._id}
                            style={{ borderBottom: "1px solid var(--color-border)" }}
                        >
                            <td style={cellStyle}>{s.name}</td>
                            <td style={{ ...cellStyle, color: "var(--color-text-secondary)" }}>{s.email}</td>
                            <td style={cellStyle}>
                                {s.roleName ? (
                                    <span
                                        style={{
                                            display: "inline-block",
                                            padding: "2px 8px",
                                            background: "var(--color-accent-light)",
                                            color: "var(--color-accent)",
                                            borderRadius: "var(--radius-full)",
                                            fontSize: 12,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {s.roleName}
                                    </span>
                                ) : (
                                    <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>—</span>
                                )}
                            </td>
                            <td style={{ ...cellStyle, color: "var(--color-text-muted)", fontSize: 12 }}>
                                {new Date(s.createdAt).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const cellStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: 14,
    color: "var(--color-text-primary)",
};
