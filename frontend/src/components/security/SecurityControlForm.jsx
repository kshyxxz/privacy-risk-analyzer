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
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		let mounted = true;
		(async () => {
			const res = await getAssets();
			if (mounted) setAssets(res.data);
		})();

		return () => {
			mounted = false;
		};
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		if (!selectedAsset) {
			setError("Please select an asset.");
			return;
		}

		try {
			await updateSecurityControl({
				asset_id: Number(selectedAsset),
				encryption,
				masking,
				hashing,
			});

			await refreshData();
			setSuccess("Security controls updated successfully.");
		} catch (err) {
			console.error("Failed to update security controls:", err);
			setError(
				err.response?.data?.error ||
					"Failed to update security controls right now.",
			);
		}
	};

	return (
		<form onSubmit={handleSubmit} style={formStyle}>
			<h2 style={{ marginTop: 0, marginBottom: "15px" }}>
				Apply Security Controls
			</h2>

			<div style={{ marginBottom: "15px" }}>
				<label style={labelStyle}>Select Asset</label>
				<select
					value={selectedAsset}
					onChange={(e) => setSelectedAsset(e.target.value)}
					required
					style={selectStyle}
				>
					<option value="">Select Asset</option>
					{assets.map((asset) => (
						<option key={asset.asset_id} value={asset.asset_id}>
							{asset.asset_name}
						</option>
					))}
				</select>
			</div>

			<div
				style={{
					display: "flex",
					gap: "20px",
					marginBottom: "15px",
					flexWrap: "wrap",
				}}
			>
				<div style={{ flex: "1", minWidth: "150px" }}>
					<SecurityToggle
						label="Encryption"
						value={encryption}
						onChange={setEncryption}
					/>
				</div>
				<div style={{ flex: "1", minWidth: "150px" }}>
					<SecurityToggle
						label="Masking"
						value={masking}
						onChange={setMasking}
					/>
				</div>
				<div style={{ flex: "1", minWidth: "150px" }}>
					<SecurityToggle
						label="Hashing"
						value={hashing}
						onChange={setHashing}
					/>
				</div>
			</div>

			{error && <div style={errorMsgStyle}>{error}</div>}
			{success && <div style={successMsgStyle}>{success}</div>}

			<button type="submit" style={buttonStyle}>
				Save Controls
			</button>
		</form>
	);
};

const formStyle = {
	backgroundColor: "white",
	borderRadius: "8px",
	boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
	padding: "20px",
	marginBottom: "20px",
};

const labelStyle = {
	display: "block",
	marginBottom: "5px",
	fontWeight: "500",
	color: "#333",
};

const selectStyle = {
	width: "100%",
	padding: "10px",
	fontSize: "14px",
	border: "1px solid #ddd",
	borderRadius: "5px",
};

const buttonStyle = {
	padding: "10px 20px",
	fontSize: "14px",
	backgroundColor: "#007bff",
	color: "white",
	border: "none",
	borderRadius: "5px",
	cursor: "pointer",
};

const errorMsgStyle = {
	padding: "10px",
	backgroundColor: "#ffe6e6",
	color: "#b00020",
	borderRadius: "5px",
	marginBottom: "10px",
};

const successMsgStyle = {
	padding: "10px",
	backgroundColor: "#e8f5e9",
	color: "#0a7a2f",
	borderRadius: "5px",
	marginBottom: "10px",
};

export default SecurityControlForm;
