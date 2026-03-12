import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";

function AddPermission() {
	const [roles, setRoles] = useState([]);
	const [assets, setAssets] = useState([]);
	const [form, setForm] = useState({
		role_id: "",
		asset_id: "",
		access_type: "",
	});

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
		API.get("/roles").then((res) =>
			setRoles(
				(Array.isArray(res.data) ? res.data : []).filter(
					(r) => String(r.role_name || "").toUpperCase() !== "ADMIN",
				),
			),
		);
		API.get("/assets").then((res) => setAssets(res.data));
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		await API.post("/permissions", form);
		alert("Permission Assigned");
	};

	return (
		<form onSubmit={handleSubmit}>
			<h2>Assign Permission</h2>

			<select
				onChange={(e) =>
					setForm({
						...form,
						role_id: e.target.value,
						access_type: "",
					})
				}
			>
				<option>Select Role</option>
				{roles.map((r) => (
					<option key={r.role_id} value={r.role_id}>
						{r.role_name}
					</option>
				))}
			</select>
			<select
				onChange={(e) => setForm({ ...form, asset_id: e.target.value })}
			>
				<option>Select Asset</option>
				{assets.map((a) => (
					<option key={a.asset_id} value={a.asset_id}>
						{a.asset_name}
					</option>
				))}
			</select>
			<select
				onChange={(e) =>
					setForm({ ...form, access_type: e.target.value })
				}
				disabled={!selectedRole}
			>
				<option>
					{selectedRole ? "Select Access Type" : "Select Role first"}
				</option>
				{allowedAccessTypes.map((accessType) => (
					<option key={accessType} value={accessType}>
						{accessType}
					</option>
				))}
			</select>
			<button>Assign</button>
		</form>
	);
}

export default AddPermission;
