import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import { Link } from "react-router-dom";

export default function PiiTypes() {
	const [pii, setPii] = useState([]);
	useEffect(() => {
		API.get("/pii").then((res) => setPii(res.data));
	}, []);
	const deletePii = async (id) => {
		await API.delete(`/pii/${id}`);
		setPii(pii.filter((item) => item.pii_id !== id));
	};

	return (
		<div>
			<h2>PII Types</h2>
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Category</th>
						<th>Weight</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{pii.map((item) => (
						<tr key={item.pii_id}>
							<td>{item.pii_name}</td>
							<td>{item.pii_category}</td>
							<td>{item.pii_weight}</td>
							<td>
								<Link to={`/edit-pii/${item.pii_id}`}>
									Edit
								</Link>
								<button onClick={() => deletePii(item.pii_id)}>
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
