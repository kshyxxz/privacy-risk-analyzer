import { useEffect, useState } from "react";
import API from "../api/axiosConfig";

export default function AssignPiiToAsset() {
	const [assets, setAssets] = useState([]);
	const [piiTypes, setPiiTypes] = useState([]);
	const [form, setForm] = useState({
		asset_id: "",
		pii_id: "",
		column_name: "",
	});

	useEffect(() => {
		API.get("/assets").then((res) => setAssets(res.data));
		API.get("/pii").then((res) => setPiiTypes(res.data));
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		await API.post("/asset-pii/assign", form);
		alert("Assigned Successfully!");
	};

	return (
		<div>
			<form onSubmit={handleSubmit}>
				<label>
					Asset
					<select
						value={form.asset_id}
						onChange={(e) =>
							setForm((prev) => ({
								...prev,
								asset_id: e.target.value,
							}))
						}
						required
					>
						<option value="">Select asset</option>
						{assets.map((a) => (
							<option key={a.asset_id} value={a.asset_id}>
								{a.asset_name}
							</option>
						))}
					</select>
				</label>

				<label>
					PII Type
					<select
						value={form.pii_id}
						onChange={(e) =>
							setForm((prev) => ({
								...prev,
								pii_id: e.target.value,
							}))
						}
						required
					>
						<option value="">Select PII</option>
						{piiTypes.map((p) => (
							<option key={p.pii_id} value={p.pii_id}>
								{p.pii_name}
							</option>
						))}
					</select>
				</label>

				<label>
					Column Name
					<input
						value={form.column_name}
						onChange={(e) =>
							setForm((prev) => ({
								...prev,
								column_name: e.target.value,
							}))
						}
						required
					/>
				</label>

				<button type="submit">Assign</button>
			</form>
		</div>
	);
}
