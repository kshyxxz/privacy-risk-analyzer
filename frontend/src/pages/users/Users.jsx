import { useContext, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../api/axiosConfig";
import { AuthContext } from "../../context/AuthContext";

export default function Users() {
	const { user } = useContext(AuthContext);
	const role = localStorage.getItem("role") || user?.role;

	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (role !== "Admin") {
			setLoading(false);
			return;
		}

		const fetchUsers = async () => {
			try {
				setLoading(true);
				setError("");
				const res = await api.get("/users");
				setUsers(Array.isArray(res.data) ? res.data : []);
			} catch (err) {
				console.error("Failed to fetch users:", err);
				setError("Unable to load users right now.");
			} finally {
				setLoading(false);
			}
		};

		fetchUsers();
	}, [role]);

	return (
		<div>
			<Navbar />
			<div
				style={{
					padding: "30px 20px",
					maxWidth: "1200px",
					margin: "0 auto",
					backgroundColor: "#f5f5f5",
					minHeight: "calc(100vh - 60px)",
				}}
			>
				<h1 style={{ marginTop: 0, marginBottom: "20px" }}>Users</h1>

				{role !== "Admin" && (
					<div style={noticeStyle}>
						You do not have permission to view users.
					</div>
				)}

				{role === "Admin" && loading && (
					<div style={{ color: "#666" }}>Loading users...</div>
				)}

				{role === "Admin" && !loading && error && (
					<div style={errorStyle}>{error}</div>
				)}

				{role === "Admin" &&
					!loading &&
					!error &&
					users.length === 0 && (
						<div style={{ color: "#666" }}>No users found.</div>
					)}

				{role === "Admin" && !loading && !error && users.length > 0 && (
					<div style={tableContainerStyle}>
						<table
							style={{
								width: "100%",
								borderCollapse: "collapse",
							}}
						>
							<thead>
								<tr style={{ backgroundColor: "#f8f9fa" }}>
									<th style={cellHeaderStyle}>User ID</th>
									<th style={cellHeaderStyle}>Username</th>
									<th style={cellHeaderStyle}>Email</th>
									<th style={cellHeaderStyle}>Role</th>
								</tr>
							</thead>
							<tbody>
								{users.map((entry) => (
									<tr key={entry.user_id}>
										<td style={cellBodyStyle}>
											{entry.user_id}
										</td>
										<td style={cellBodyStyle}>
											{entry.username || "-"}
										</td>
										<td style={cellBodyStyle}>
											{entry.email || "-"}
										</td>
										<td style={cellBodyStyle}>
											{entry.role || "-"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

const tableContainerStyle = {
	backgroundColor: "white",
	borderRadius: "8px",
	boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
	overflowX: "auto",
};

const noticeStyle = {
	padding: "12px",
	backgroundColor: "#fff4e5",
	color: "#8a5700",
	borderRadius: "6px",
};

const errorStyle = {
	padding: "12px",
	backgroundColor: "#ffe6e6",
	color: "#b00020",
	borderRadius: "6px",
	marginBottom: "16px",
};

const cellHeaderStyle = {
	textAlign: "left",
	padding: "12px",
	borderBottom: "1px solid #ddd",
	fontWeight: 600,
};

const cellBodyStyle = {
	padding: "12px",
	borderBottom: "1px solid #eee",
	fontSize: "14px",
};

