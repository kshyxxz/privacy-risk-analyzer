import { useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axiosConfig";

function EditPermission() {
	const { id } = useParams();
	const [form, setForm] = useState({
		role_id: "",
		asset_id: "",
		access_type: "",
	});

	const handleSubmit = async (e) => {
		e.preventDefault();
		await API.put(`/permissions/${id}`, form);
		alert("Updated");
	};

	return (
		<form onSubmit={handleSubmit}>
			<h2>Edit Permission</h2>
			<input
				placeholder="Role ID"
				onChange={(e) => setForm({ ...form, role_id: e.target.value })}
			/>
			<input
				placeholder="Asset ID"
				onChange={(e) => setForm({ ...form, asset_id: e.target.value })}
			/>
			<input
				placeholder="Access Type"
				onChange={(e) =>
					setForm({ ...form, access_type: e.target.value })
				}
			/>
			<button>Update</button>
		</form>
	);
}

export default EditPermission;
