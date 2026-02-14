import { useEffect, useState } from "react";

export default function AssignPiiToAsset() {
	const [assets, setAssets] = useState([]);
	const [piiTpyes, setPiiTypes] = useState([]);
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
				<select onChange={(e) => setForm}></select>
			</form>
		</div>
	);
}
