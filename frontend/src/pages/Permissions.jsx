import { useEffect, useState } from "react";
import { useContext } from "react";
import API from "../api/axiosConfig";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

export default function Permissions() {
	const { user } = useContext(AuthContext);
	const role = localStorage.getItem("role") || user?.role;
	const isAdmin = role === "Admin";

	const [permissions, setPermissions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [roles, setRoles] = useState([]);
	const [assets, setAssets] = useState([]);
	const [form, setForm] = useState({
		role_id: "",
		asset_id: "",
		access_type: "",
	});
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!isAdmin) {
			setLoading(false);
			return;
		}

		const fetchData = async () => {
			try {
				setLoading(true);
				setError("");
				const [permRes, rolesRes, assetsRes] = await Promise.all([
					API.get("/permissions"),
					API.get("/roles"),
					API.get("/assets"),
				]);
				setPermissions(Array.isArray(permRes.data) ? permRes.data : []);
				setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
				setAssets(Array.isArray(assetsRes.data) ? assetsRes.data : []);
			} catch (err) {
				console.error("Failed to load data:", err);
				setError("Unable to load permissions right now.");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [isAdmin]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!form.role_id || !form.asset_id || !form.access_type) {
			setError("All fields are required");
			return;
		}
		try {
			setSaving(true);
			setError("");
			await API.post("/permissions", form);
			setForm({ role_id: "", asset_id: "", access_type: "" });
			setShowForm(false);
			const res = await API.get("/permissions");
			setPermissions(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			console.error("Failed to create permission:", err);
			setError(
				err.response?.data?.error || "Failed to create permission",
			);
		} finally {
			setSaving(false);
		}
	};

	const deletePermission = async (id) => {
		if (
			!window.confirm("Are you sure you want to delete this permission?")
		) {
			return;
		}
		try {
			await API.delete(`/permissions/${id}`);
			const res = await API.get("/permissions");
			setPermissions(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			console.error("Failed to delete permission:", err);
			setError(
				err.response?.data?.error || "Failed to delete permission.",
			);
		}
	};

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
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "20px",
					}}
				>
					<h1 style={{ marginTop: 0, marginBottom: 0 }}>
						Permissions
					</h1>
					{isAdmin && (
						<button
							onClick={() => setShowForm(!showForm)}
							style={{
								padding: "10px 20px",
								fontSize: "14px",
								backgroundColor: showForm
									? "#6c757d"
									: "#007bff",
								color: "white",
								border: "none",
								borderRadius: "5px",
								cursor: "pointer",
							}}
						>
							{showForm ? "Cancel" : "+ Add Permission"}
						</button>
					)}
				</div>

				{!isAdmin && (
					<div style={noticeStyle}>
						You do not have permission to manage permissions.
					</div>
				)}

				{error && <div style={errorStyle}>{error}</div>}

				{isAdmin && showForm && (
					<div style={formContainerStyle}>
						<h3 style={{ marginTop: 0, marginBottom: "15px" }}>
							Assign New Permission
						</h3>
						<form onSubmit={handleSubmit}>
							<div style={{ marginBottom: "15px" }}>
								<label style={labelStyle}>Role</label>
								<select
									value={form.role_id}
									onChange={(e) =>
										setForm({
											...form,
											role_id: e.target.value,
										})
									}
									style={selectStyle}
									required
								>
									<option value="">Select Role</option>
									{roles.map((r) => (
										<option
											key={r.role_id}
											value={r.role_id}
										>
											{r.role_name}
										</option>
									))}
								</select>
							</div>

							<div style={{ marginBottom: "15px" }}>
								<label style={labelStyle}>Data Asset</label>
								<select
									value={form.asset_id}
									onChange={(e) =>
										setForm({
											...form,
											asset_id: e.target.value,
										})
									}
									style={selectStyle}
									required
								>
									<option value="">Select Data Asset</option>
									{assets.map((a) => (
										<option
											key={a.asset_id}
											value={a.asset_id}
										>
											{a.asset_name}
										</option>
									))}
								</select>
							</div>

							<div style={{ marginBottom: "15px" }}>
								<label style={labelStyle}>Access Type</label>
								<select
									value={form.access_type}
									onChange={(e) =>
										setForm({
											...form,
											access_type: e.target.value,
										})
									}
									style={selectStyle}
									required
								>
									<option value="">Select Access Type</option>
									<option value="READ">READ</option>
									<option value="WRITE">WRITE</option>
									<option value="UPDATE">UPDATE</option>
								</select>
							</div>

							<button
								type="submit"
								disabled={saving}
								style={submitButtonStyle}
							>
								{saving ? "Assigning..." : "Assign Permission"}
							</button>
						</form>
					</div>
				)}

				{isAdmin && loading && (
					<div style={{ color: "#666" }}>Loading permissions...</div>
				)}

				{isAdmin &&
					!loading &&
					!showForm &&
					permissions.length === 0 && (
						<div style={{ color: "#666" }}>
							No permissions found.
						</div>
					)}

				{isAdmin && !loading && permissions.length > 0 && (
					<div style={tableContainerStyle}>
						<table
							style={{
								width: "100%",
								borderCollapse: "collapse",
							}}
						>
							<thead>
								<tr style={{ backgroundColor: "#f8f9fa" }}>
									<th style={cellHeaderStyle}>
										Permission ID
									</th>
									<th style={cellHeaderStyle}>Role</th>
									<th style={cellHeaderStyle}>Asset</th>
									<th style={cellHeaderStyle}>Access Type</th>
									<th style={cellHeaderStyle}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{permissions.map((p) => (
									<tr key={p.permission_id}>
										<td style={cellBodyStyle}>
											{p.permission_id}
										</td>
										<td style={cellBodyStyle}>
											{p.role_name || "-"}
										</td>
										<td style={cellBodyStyle}>
											{p.asset_name || "-"}
										</td>
										<td style={cellBodyStyle}>
											{p.access_type}
										</td>
										<td style={cellBodyStyle}>
											<button
												onClick={() =>
													deletePermission(
														p.permission_id,
													)
												}
												style={deleteButtonStyle}
											>
												Delete
											</button>
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

const formContainerStyle = {
	backgroundColor: "white",
	borderRadius: "8px",
	boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
	padding: "20px",
	marginBottom: "20px",
};

const labelStyle = {
	display: "block",
	marginBottom: "5px",
	fontSize: "14px",
	fontWeight: "500",
	color: "#333",
};

const selectStyle = {
	width: "100%",
	padding: "10px",
	fontSize: "14px",
	border: "1px solid #ddd",
	borderRadius: "5px",
	boxSizing: "border-box",
};

const submitButtonStyle = {
	padding: "10px 20px",
	fontSize: "14px",
	backgroundColor: "#28a745",
	color: "white",
	border: "none",
	borderRadius: "5px",
	cursor: "pointer",
	marginTop: "10px",
};

const deleteButtonStyle = {
	padding: "4px 8px",
	fontSize: "12px",
	backgroundColor: "#dc3545",
	color: "white",
	border: "none",
	borderRadius: "4px",
	cursor: "pointer",
};

const tableContainerStyle = {
	backgroundColor: "white",
	borderRadius: "8px",
	boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
	overflowX: "auto",
	marginTop: "20px",
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

const errorStyle = {
	marginTop: "10px",
	padding: "10px",
	backgroundColor: "#ffe6e6",
	color: "#b00020",
	borderRadius: "6px",
};

const noticeStyle = {
	padding: "12px",
	backgroundColor: "#fff4e5",
	color: "#8a5700",
	borderRadius: "6px",
	marginBottom: "16px",
};
