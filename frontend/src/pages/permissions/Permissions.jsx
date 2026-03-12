import { useEffect, useState } from "react";
import { useContext } from "react";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import { AuthContext } from "../../context/AuthContext";

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

	const getAllowedAccessTypes = (roleName) => {
		const normalizedRole = String(roleName || "").toUpperCase();
		if (normalizedRole === "ADMIN") {
			return ["READ", "WRITE", "UPDATE", "DELETE"];
		}
		return ["READ"];
	};

	const selectedRole = roles.find(
		(r) => String(r.role_id) === String(form.role_id),
	);
	const allowedAccessTypes = selectedRole
		? getAllowedAccessTypes(selectedRole.role_name)
		: [];

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
				setRoles(
					(Array.isArray(rolesRes.data) ? rolesRes.data : []).filter(
						(r) =>
							String(r.role_name || "").toUpperCase() !== "ADMIN",
					),
				);
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
		if (!window.confirm("Remove this access type?")) {
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
											access_type: "",
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
									disabled={!selectedRole}
								>
									<option value="">
										{selectedRole
											? "Select Access Type"
											: "Select Role first"}
									</option>
									{allowedAccessTypes.map((accessType) => (
										<option
											key={accessType}
											value={accessType}
										>
											{accessType}
										</option>
									))}
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
									<th style={cellHeaderStyle}>Role</th>
									<th style={cellHeaderStyle}>Asset</th>
									<th style={cellHeaderStyle}>
										Access Types
									</th>
									<th style={cellHeaderStyle}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{Object.values(
									permissions.reduce((groups, p) => {
										const key = `${p.role_id}_${p.asset_id}`;
										if (!groups[key]) {
											groups[key] = {
												role_id: p.role_id,
												asset_id: p.asset_id,
												role_name: p.role_name,
												asset_name: p.asset_name,
												entries: [],
											};
										}
										groups[key].entries.push(p);
										return groups;
									}, {}),
								).map((group) => (
									<tr
										key={`${group.role_id}_${group.asset_id}`}
									>
										<td style={cellBodyStyle}>
											{group.role_name || "-"}
										</td>
										<td style={cellBodyStyle}>
											{group.asset_name || "-"}
										</td>
										<td style={cellBodyStyle}>
											<div
												style={{
													display: "flex",
													flexWrap: "wrap",
													gap: "6px",
												}}
											>
												{group.entries.map((entry) => (
													<span
														key={
															entry.permission_id
														}
														style={accessBadgeStyle(
															entry.access_type,
														)}
													>
														{entry.access_type}
														<button
															onClick={() =>
																deletePermission(
																	entry.permission_id,
																)
															}
															style={
																badgeDeleteStyle
															}
															title={`Remove ${entry.access_type}`}
														>
															✕
														</button>
													</span>
												))}
											</div>
										</td>
										<td style={cellBodyStyle}>
											<button
												onClick={async () => {
													if (
														!window.confirm(
															`Delete ALL permissions for ${group.role_name} on ${group.asset_name}?`,
														)
													)
														return;
													for (const entry of group.entries) {
														await API.delete(
															`/permissions/${entry.permission_id}`,
														);
													}
													const res =
														await API.get(
															"/permissions",
														);
													setPermissions(
														Array.isArray(res.data)
															? res.data
															: [],
													);
												}}
												style={deleteButtonStyle}
											>
												Delete All
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

const ACCESS_TYPE_COLORS = {
	READ: { bg: "#d1fae5", text: "#065f46" },
	WRITE: { bg: "#dbeafe", text: "#1e40af" },
	UPDATE: { bg: "#fef3c7", text: "#92400e" },
	DELETE: { bg: "#fee2e2", text: "#991b1b" },
};

const accessBadgeStyle = (accessType) => {
	const colors = ACCESS_TYPE_COLORS[accessType] || {
		bg: "#e5e7eb",
		text: "#374151",
	};
	return {
		display: "inline-flex",
		alignItems: "center",
		gap: "4px",
		padding: "3px 8px",
		borderRadius: "12px",
		fontSize: "12px",
		fontWeight: "600",
		backgroundColor: colors.bg,
		color: colors.text,
	};
};

const badgeDeleteStyle = {
	background: "none",
	border: "none",
	cursor: "pointer",
	fontSize: "11px",
	padding: "0",
	lineHeight: 1,
	color: "inherit",
	opacity: 0.7,
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
