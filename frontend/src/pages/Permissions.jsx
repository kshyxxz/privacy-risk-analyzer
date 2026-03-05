import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axiosConfig";

export default function Permissions() {
	const [permissions, setPermissions] = useState([]);
	const fetchPermission = async () => {
		const res = await API.get("/permissions");
		setPermissions(res.data);
	};

	useEffect(() => {
		(async () => {
			await fetchPermission();
		})();
	}, []);
	const deletePermission = async (id) => {
		await API.delete(`/permissions/${id}`);
		fetchPermission();
	};

	return (
		<div>
			<h2>Access Permissions</h2>
			<Link to="/add-permission">Assign Permission</Link>
			<table>
				<thead>
					<tr>
						<th>Roles</th>
						<th>Assets</th>
						<th>Access Type</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{permissions.map((p) => (
						<tr key={p.permission_id}>
							<td>{p.role_name}</td>
							<td>{p.asset_name}</td>
							<td>{p.access_type}</td>
							<td>
								<Link
									to={`/edit-permission/${p.permission_id}`}
								>
									Edit
								</Link>
								<button
									onClick={() =>
										deletePermission(p.permission_id)
									}
								>
									Delete
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
