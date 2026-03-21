import { useCallback, useContext, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../api/axiosConfig";
import { AuthContext } from "../../context/AuthContext";

export default function Assets() {
	const { user } = useContext(AuthContext);
	const role = localStorage.getItem("role") || user?.role;
	const isAdmin = role === "Admin";

	const [assets, setAssets] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const [deletingAssetId, setDeletingAssetId] = useState(null);
	const [saveError, setSaveError] = useState("");
	const [form, setForm] = useState({
		asset_name: "",
		db_name: "",
		table_name: "",
		sensitivity_level: "",
		contains_pii: false,
	});

	const fetchAssets = useCallback(async () => {
		try {
			setLoading(true);
			setError("");
			const res = await api.get("/assets");
			setAssets(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			console.error("Failed to fetch assets:", err);
			setError("Unable to load data assets right now.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAssets();
	}, [fetchAssets]);

	const handleAddAsset = async (e) => {
		e.preventDefault();
		if (!isAdmin) {
			return;
		}

		try {
			setSaving(true);
			setSaveError("");
			const payload = {
				asset_name: form.asset_name.trim(),
				db_name: form.db_name.trim() || null,
				table_name: form.table_name.trim() || null,
				sensitivity_level: form.sensitivity_level.trim() || null,
				contains_pii: form.contains_pii,
			};
			console.log("📤 Sending asset payload:", payload);
			await api.post("/assets", payload);

			setForm({
				asset_name: "",
				db_name: "",
				table_name: "",
				sensitivity_level: "",
				contains_pii: false,
			});
			await fetchAssets();
		} catch (err) {
			console.error("Failed to add asset:", err);
			setSaveError(
				err.response?.data?.error || "Unable to add asset right now.",
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteAsset = async (assetId) => {
		if (!isAdmin) {
			return;
		}

		const shouldDelete = window.confirm(
			"Are you sure you want to delete this data asset?",
		);
		if (!shouldDelete) {
			return;
		}

		try {
			setSaveError("");
			setDeletingAssetId(assetId);
			await api.delete(`/assets/${assetId}`);
			await fetchAssets();
		} catch (err) {
			console.error("Failed to delete asset:", err);
			setSaveError(
				err.response?.data?.error ||
					"Unable to delete asset right now.",
			);
		} finally {
			setDeletingAssetId(null);
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
				<h1 style={{ marginTop: 0, marginBottom: "20px" }}>
					Data Assets
				</h1>

				{isAdmin && (
					<div
						style={{
							backgroundColor: "white",
							borderRadius: "8px",
							boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
							padding: "16px",
							marginBottom: "20px",
						}}
					>
						<h3 style={{ marginTop: 0, marginBottom: "12px" }}>
							Add Data Asset
						</h3>
						<form onSubmit={handleAddAsset}>
							<div style={formGridStyle}>
								<input
									placeholder="asset_name"
									value={form.asset_name}
									onChange={(e) =>
										setForm((prev) => ({
											...prev,
											asset_name: e.target.value,
										}))
									}
									style={inputStyle}
									required
								/>
								<input
									placeholder="db_name"
									value={form.db_name}
									onChange={(e) =>
										setForm((prev) => ({
											...prev,
											db_name: e.target.value,
										}))
									}
									style={inputStyle}
								/>
								<input
									placeholder="table_name"
									value={form.table_name}
									onChange={(e) =>
										setForm((prev) => ({
											...prev,
											table_name: e.target.value,
										}))
									}
									style={inputStyle}
								/>
								<select
									value={form.sensitivity_level}
									onChange={(e) =>
										setForm((prev) => ({
											...prev,
											sensitivity_level: e.target.value,
										}))
									}
									style={inputStyle}
								>
									<option value="">
										Select sensitivity level
									</option>
									<option value="Public">Public</option>
									<option value="Internal">Internal</option>
									<option value="Confidential">
										Confidential
									</option>
									<option value="Restricted">
										Restricted
									</option>
									<option value="Top Secret">
										Top Secret
									</option>
								</select>
								<label style={gridCheckboxLabelStyle}>
									<input
										type="checkbox"
										checked={form.contains_pii}
										onChange={(e) =>
											setForm((prev) => ({
												...prev,
												contains_pii: e.target.checked,
											}))
										}
									/>
									Contains PII
								</label>
							</div>
							{saveError && (
								<div style={inlineErrorStyle}>{saveError}</div>
							)}
							<div style={{ marginTop: "10px" }}>
								<button
									type="submit"
									disabled={saving}
									style={buttonStyle}
								>
									{saving ? "Adding..." : "Add Asset"}
								</button>
							</div>
						</form>
					</div>
				)}

				{loading && (
					<div style={{ color: "#666" }}>Loading data assets...</div>
				)}

				{!loading && error && (
					<div
						style={{
							padding: "12px",
							backgroundColor: "#ffe6e6",
							color: "#b00020",
							borderRadius: "6px",
							marginBottom: "16px",
						}}
					>
						{error}
					</div>
				)}

				{!loading && !error && assets.length === 0 && (
					<div style={{ color: "#666" }}>No assets found.</div>
				)}

				{!loading && !error && assets.length > 0 && (
					<div
						style={{
							backgroundColor: "white",
							borderRadius: "8px",
							boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
							overflowX: "auto",
						}}
					>
						<table
							style={{
								width: "100%",
								borderCollapse: "collapse",
							}}
						>
							<thead>
								<tr style={{ backgroundColor: "#f8f9fa" }}>
									<th style={cellHeaderStyle}>Asset ID</th>
									<th style={cellHeaderStyle}>Asset Name</th>
									<th style={cellHeaderStyle}>DB Name</th>
									<th style={cellHeaderStyle}>Table Name</th>
									<th style={cellHeaderStyle}>
										Sensitivity Level
									</th>
									<th style={cellHeaderStyle}>
										Contains PII
									</th>
									<th style={cellHeaderStyle}>Created By</th>
									<th style={cellHeaderStyle}>Created At</th>
									{isAdmin && (
										<th style={cellHeaderStyle}>Actions</th>
									)}
								</tr>
							</thead>
							<tbody>
								{assets.map((asset) => (
									<tr key={asset.asset_id}>
										<td style={cellBodyStyle}>
											{asset.asset_id}
										</td>
										<td style={cellBodyStyle}>
											{asset.asset_name || "-"}
										</td>
										<td style={cellBodyStyle}>
											{asset.db_name || "-"}
										</td>
										<td style={cellBodyStyle}>
											{asset.table_name || "-"}
										</td>
										<td style={cellBodyStyle}>
											{asset.sensitivity_level || "-"}
										</td>
										<td style={cellBodyStyle}>
											{asset.contains_pii ? "Yes" : "No"}
										</td>
										<td style={cellBodyStyle}>
											{asset.created_by || "-"}
										</td>
										<td style={cellBodyStyle}>
											{asset.created_at
												? new Date(
														asset.created_at,
													).toLocaleString()
												: "-"}
										</td>
										{isAdmin && (
											<td style={cellBodyStyle}>
												<button
													onClick={() =>
														handleDeleteAsset(
															asset.asset_id,
														)
													}
													disabled={
														deletingAssetId ===
														asset.asset_id
													}
													style={deleteButtonStyle}
												>
													{deletingAssetId ===
													asset.asset_id
														? "Deleting..."
														: "Delete"}
												</button>
											</td>
										)}
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

const formGridStyle = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
	gap: "10px",
};

const inputStyle = {
	padding: "10px",
	border: "1px solid #ccc",
	borderRadius: "6px",
};

const gridCheckboxLabelStyle = {
	display: "flex",
	alignItems: "center",
	gap: "8px",
	fontSize: "14px",
	color: "#333",
	padding: "10px",
	backgroundColor: "#f9f9f9",
	borderRadius: "6px",
	border: "1px solid #e0e0e0",
};

const buttonStyle = {
	padding: "10px 14px",
	backgroundColor: "#007bff",
	color: "white",
	border: "none",
	borderRadius: "6px",
	cursor: "pointer",
};

const inlineErrorStyle = {
	marginTop: "10px",
	color: "#b00020",
	fontSize: "14px",
};

const deleteButtonStyle = {
	padding: "6px 10px",
	backgroundColor: "#dc3545",
	color: "white",
	border: "none",
	borderRadius: "6px",
	cursor: "pointer",
	fontSize: "13px",
};
