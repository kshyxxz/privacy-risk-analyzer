import React, { useEffect, useState } from "react";
import SecurityToggle from "./SecurityToggle";
import {
	getAssets,
	updateSecurityControl,
} from "../../services/securityService";

const SecurityControlForm = ({ refreshData }) => {
	const [assets, setAssets] = useState([]);
	const [selectedAsset, setSelectedAsset] = useState("");
	const [encryption, setEncryption] = useState(false);
	const [masking, setMasking] = useState(false);
	const [hashing, setHashing] = useState(false);

	useEffect(() => {
		fetchAssets();
	}, []);

	const fetchAssets = async () => {
		const res = await getAssets();
		setAssets(res.data);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		await updateSecurityControl({
			asset_id: selectedAsset,
			encryption,
			masking,
			hashing,
		});

		refreshData();
		alert("Security controls updated successfully!");
	};

	return (
		<form onSubmit={handleSubmit} className="security-form">
			<h3>Apply Security Controls</h3>

			<select
				value={selectedAsset}
				onChange={(e) => setSelectedAsset(e.target.value)}
				required
			>
				<option value="">Select Asset</option>
				{assets.map((asset) => (
					<option key={asset.asset_id} value={asset.asset_id}>
						{asset.asset_name}
					</option>
				))}
			</select>

			<SecurityToggle
				label="Encryption"
				value={encryption}
				onChange={setEncryption}
			/>
			<SecurityToggle
				label="Masking"
				value={masking}
				onChange={setMasking}
			/>
			<SecurityToggle
				label="Hashing"
				value={hashing}
				onChange={setHashing}
			/>

			<button type="submit">Save Controls</button>
		</form>
	);
};

export default SecurityControlForm;
