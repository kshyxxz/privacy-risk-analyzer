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

	useEffect(() => {
		API.get("/roles").then((res) => setRoles(res.data));
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
				onChange={(e) => setForm({ ...form, role_id: e.target.value })}
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
			>
				<option>Select Access Type</option>
				<option value="READ">READ</option>
				<option value="WRITE">WRITE</option>
				<option value="UPDATE">UPDATE</option>
				<option value="DELETE">DELETE</option>
			</select>
			<button>Assign</button>
		</form>
	);
}

export default AddPermission;
