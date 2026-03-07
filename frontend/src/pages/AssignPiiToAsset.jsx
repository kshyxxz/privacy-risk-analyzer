import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axiosConfig";

export default function AssignPiiToAsset() {
	const [assets, setAssets] = useState([]);
	const [piiTypes, setPiiTypes] = useState([]);
	const [selectedAsset, setSelectedAsset] = useState("");
	const [existingMappings, setExistingMappings] = useState([]);
	const [newMappings, setNewMappings] = useState([]);
	const [formInput, setFormInput] = useState({
		pii_id: "",
		column_name: "",
	});
	const [loading, setLoading] = useState(false);
	const [fetchingMappings, setFetchingMappings] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [assetsRes, piiRes] = await Promise.all([
					api.get("/assets"),
					api.get("/pii"),
				]);
				setAssets(Array.isArray(assetsRes.data) ? assetsRes.data : []);
				setPiiTypes(Array.isArray(piiRes.data) ? piiRes.data : []);
			} catch (err) {
				console.error("Failed to fetch data:", err);
				setError("Failed to load data.");
			}
		};
		fetchData();
	}, []);

	const handleAssetChange = async (assetId) => {
		setSelectedAsset(assetId);
		setNewMappings([]);
		setFormInput({ pii_id: "", column_name: "" });
		setError("");
		setSuccess("");

		if (assetId) {
			setFetchingMappings(true);
			try {
				const res = await api.get(`/asset-pii/${assetId}`);
				setExistingMappings(Array.isArray(res.data) ? res.data : []);
			} catch (err) {
				console.error("Failed to fetch existing mappings:", err);
				setExistingMappings([]);
			} finally {
				setFetchingMappings(false);
			}
		} else {
			setExistingMappings([]);
		}
	};

	const handleAddMapping = (e) => {
		e.preventDefault();
		if (!formInput.pii_id || !formInput.column_name.trim()) {
			setError("Please select a PII Type and enter a column name");
			return;
		}

		const piiId = Number(formInput.pii_id);
		if (!piiId || isNaN(piiId)) {
			setError("Invalid PII Type selection");
			return;
		}

		const piiType = piiTypes.find((p) => {
			const piiTypeId =
				typeof p.pii_id === "string" ? parseInt(p.pii_id) : p.pii_id;
			return piiTypeId === piiId;
		});

		if (!piiType) {
			setError("Selected PII Type not found");
			return;
		}

		const newMapping = {
			pii_id: piiId,
			column_name: formInput.column_name.trim(),
			pii_name: piiType.pii_name,
		};

		setNewMappings([...newMappings, newMapping]);
		setFormInput({ pii_id: "", column_name: "" });
		setError("");
	};

	const handleRemoveNewMapping = (index) => {
		setNewMappings(newMappings.filter((_, i) => i !== index));
	};

	const handleRemoveExistingMapping = async (mappingId) => {
		if (
			!window.confirm("Are you sure you want to remove this PII mapping?")
		) {
			return;
		}

		try {
			setLoading(true);
			await api.delete("/asset-pii/remove", {
				data: { mapping_id: mappingId },
			});
			setExistingMappings(
				existingMappings.filter((m) => m.mapping_id !== mappingId),
			);
			setSuccess("PII mapping removed successfully!");
		} catch (err) {
			console.error("Failed to remove mapping:", err);
			setError(
				err.response?.data?.error ||
					"Failed to remove PII mapping. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!selectedAsset) {
			setError("Please select a data asset");
			return;
		}
		if (newMappings.length === 0) {
			setError("Please add at least one PII mapping");
			return;
		}

		try {
			setLoading(true);
			setError("");
			setSuccess("");

			console.log("=== handleSubmit DEBUG ===");
			console.log(
				"selectedAsset:",
				selectedAsset,
				"type:",
				typeof selectedAsset,
			);
			console.log("newMappings:", JSON.stringify(newMappings, null, 2));

			// Validate all mappings have required fields before sending
			for (const m of newMappings) {
				if (!m.pii_id || !m.column_name) {
					setError(
						"Invalid mapping data - missing pii_id or column_name",
					);
					setLoading(false);
					return;
				}
			}

			// Submit all new mappings for the selected asset
			const payload = newMappings.map((m) => ({
				asset_id: parseInt(selectedAsset),
				pii_id: Number(m.pii_id),
				column_name: m.column_name.trim(),
			}));

			const requestData = {
				asset_id: parseInt(selectedAsset),
				mappings: payload,
			};

			console.log(
				"Full request data:",
				JSON.stringify(requestData, null, 2),
			);
			console.log(
				"Is mappings an array?",
				Array.isArray(requestData.mappings),
			);
			console.log("Number of mappings:", requestData.mappings.length);

			await api.post("/asset-pii/assign", requestData);

			setSuccess("PII mappings assigned successfully!");
			setNewMappings([]);

			// Refresh existing mappings
			const res = await api.get(`/asset-pii/${selectedAsset}`);
			setExistingMappings(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			console.error("Failed to assign PII mappings:", err);
			console.error("Response data:", err.response?.data);
			setError(
				err.response?.data?.error ||
					"Failed to assign PII mappings. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	};

	const selectedAssetName = assets.find(
		(a) => a.asset_id === parseInt(selectedAsset),
	)?.asset_name;

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
				<h1 style={{ marginTop: 0, marginBottom: "30px" }}>
					Assign PII to Data Assets
				</h1>

				{/* Error and Success Messages */}
				{error && (
					<div
						style={{
							padding: "12px",
							backgroundColor: "#f8d7da",
							color: "#721c24",
							borderRadius: "4px",
							marginBottom: "20px",
							fontSize: "14px",
						}}
					>
						{error}
					</div>
				)}
				{success && (
					<div
						style={{
							padding: "12px",
							backgroundColor: "#d4edda",
							color: "#155724",
							borderRadius: "4px",
							marginBottom: "20px",
							fontSize: "14px",
						}}
					>
						{success}
					</div>
				)}

				{/* Asset Selection */}
				<div
					style={{
						backgroundColor: "white",
						borderRadius: "8px",
						boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
						padding: "20px",
						marginBottom: "30px",
					}}
				>
					<h3 style={{ marginTop: 0, marginBottom: "16px" }}>
						Select Data Asset
					</h3>
					<select
						value={selectedAsset}
						onChange={(e) => handleAssetChange(e.target.value)}
						style={{
							padding: "10px",
							borderRadius: "4px",
							border: "1px solid #ddd",
							fontSize: "14px",
							width: "100%",
							maxWidth: "400px",
						}}
					>
						<option value="">Select a data asset</option>
						{assets.map((asset) => (
							<option key={asset.asset_id} value={asset.asset_id}>
								{asset.asset_name}
							</option>
						))}
					</select>
				</div>

				{selectedAsset && (
					<>
						{/* Existing Mappings Section */}
						{fetchingMappings && (
							<div style={{ color: "#666", padding: "20px" }}>
								Loading existing mappings...
							</div>
						)}

						{!fetchingMappings && existingMappings.length > 0 && (
							<div
								style={{
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									padding: "20px",
									marginBottom: "30px",
								}}
							>
								<h3
									style={{
										marginTop: 0,
										marginBottom: "16px",
									}}
								>
									Current PII Mappings for {selectedAssetName}
								</h3>
								<table
									style={{
										width: "100%",
										borderCollapse: "collapse",
									}}
								>
									<thead>
										<tr
											style={{
												backgroundColor: "#f9f9f9",
												borderBottom: "2px solid #ddd",
											}}
										>
											<th
												style={{
													padding: "12px",
													textAlign: "left",
													fontSize: "13px",
													fontWeight: "600",
												}}
											>
												PII Type
											</th>
											<th
												style={{
													padding: "12px",
													textAlign: "left",
													fontSize: "13px",
													fontWeight: "600",
												}}
											>
												Category
											</th>
											<th
												style={{
													padding: "12px",
													textAlign: "left",
													fontSize: "13px",
													fontWeight: "600",
												}}
											>
												Weight
											</th>
											<th
												style={{
													padding: "12px",
													textAlign: "left",
													fontSize: "13px",
													fontWeight: "600",
												}}
											>
												Column Name
											</th>
											<th
												style={{
													padding: "12px",
													textAlign: "center",
													fontSize: "13px",
													fontWeight: "600",
												}}
											>
												Action
											</th>
										</tr>
									</thead>
									<tbody>
										{existingMappings.map((mapping) => (
											<tr
												key={mapping.mapping_id}
												style={{
													borderBottom:
														"1px solid #e0e0e0",
												}}
											>
												<td
													style={{
														padding: "12px",
														fontSize: "14px",
													}}
												>
													{mapping.pii_name}
												</td>
												<td
													style={{
														padding: "12px",
														fontSize: "14px",
													}}
												>
													{mapping.pii_category ||
														"-"}
												</td>
												<td
													style={{
														padding: "12px",
														fontSize: "14px",
													}}
												>
													{mapping.pii_weight}
												</td>
												<td
													style={{
														padding: "12px",
														fontSize: "14px",
														fontFamily: "monospace",
													}}
												>
													{mapping.column_name}
												</td>
												<td
													style={{
														padding: "12px",
														textAlign: "center",
													}}
												>
													<button
														onClick={() =>
															handleRemoveExistingMapping(
																mapping.mapping_id,
															)
														}
														disabled={loading}
														style={{
															padding: "6px 12px",
															backgroundColor:
																loading
																	? "#ccc"
																	: "#dc3545",
															color: "white",
															border: "none",
															borderRadius: "4px",
															cursor: loading
																? "not-allowed"
																: "pointer",
															fontSize: "12px",
														}}
													>
														Delete
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						{!fetchingMappings && existingMappings.length === 0 && (
							<div
								style={{
									backgroundColor: "#e7f3ff",
									borderRadius: "8px",
									padding: "20px",
									marginBottom: "30px",
									color: "#0066cc",
									fontSize: "14px",
								}}
							>
								No PII mappings exist for this asset yet. Add
								some below.
							</div>
						)}

						{/* Add PII Mapping Form */}
						<div
							style={{
								backgroundColor: "white",
								borderRadius: "8px",
								boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
								padding: "20px",
								marginBottom: "30px",
							}}
						>
							<h3
								style={{
									marginTop: 0,
									marginBottom: "16px",
								}}
							>
								Add New PII Mapping for {selectedAssetName}
							</h3>
							<form onSubmit={handleAddMapping}>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 1fr auto",
										gap: "12px",
										marginBottom: "16px",
										alignItems: "end",
									}}
								>
									<div>
										<label
											style={{
												display: "block",
												marginBottom: "6px",
												fontSize: "13px",
												fontWeight: "500",
											}}
										>
											PII Type
										</label>
										<select
											value={formInput.pii_id}
											onChange={(e) =>
												setFormInput((prev) => ({
													...prev,
													pii_id: e.target.value,
												}))
											}
											style={{
												padding: "10px",
												borderRadius: "4px",
												border: "1px solid #ddd",
												fontSize: "14px",
												width: "100%",
											}}
										>
											<option value="">
												Select PII Type
											</option>
											{piiTypes.map((pii) => (
												<option
													key={pii.pii_id}
													value={pii.pii_id}
												>
													{pii.pii_name}
												</option>
											))}
										</select>
									</div>
									<div>
										<label
											style={{
												display: "block",
												marginBottom: "6px",
												fontSize: "13px",
												fontWeight: "500",
											}}
										>
											Column Name
										</label>
										<input
											type="text"
											placeholder="e.g., customer_ssn"
											value={formInput.column_name}
											onChange={(e) =>
												setFormInput((prev) => ({
													...prev,
													column_name: e.target.value,
												}))
											}
											style={{
												padding: "10px",
												borderRadius: "4px",
												border: "1px solid #ddd",
												fontSize: "14px",
												width: "100%",
											}}
										/>
									</div>
									<button
										type="submit"
										style={{
											padding: "10px 20px",
											backgroundColor: "#007bff",
											color: "white",
											border: "none",
											borderRadius: "4px",
											cursor: "pointer",
											fontSize: "14px",
											fontWeight: "500",
										}}
									>
										Add
									</button>
								</div>
							</form>

							{/* New Mappings (Unsaved) Table */}
							{newMappings.length > 0 && (
								<div style={{ marginTop: "20px" }}>
									<h4
										style={{
											marginTop: 0,
											marginBottom: "12px",
										}}
									>
										Pending Mappings (Not Yet Saved)
									</h4>
									<table
										style={{
											width: "100%",
											borderCollapse: "collapse",
										}}
									>
										<thead>
											<tr
												style={{
													backgroundColor: "#fff3cd",
													borderBottom:
														"2px solid #ddd",
												}}
											>
												<th
													style={{
														padding: "12px",
														textAlign: "left",
														fontSize: "13px",
														fontWeight: "600",
													}}
												>
													PII Type
												</th>
												<th
													style={{
														padding: "12px",
														textAlign: "left",
														fontSize: "13px",
														fontWeight: "600",
													}}
												>
													Column Name
												</th>
												<th
													style={{
														padding: "12px",
														textAlign: "center",
														fontSize: "13px",
														fontWeight: "600",
													}}
												>
													Action
												</th>
											</tr>
										</thead>
										<tbody>
											{newMappings.map(
												(mapping, index) => (
													<tr
														key={index}
														style={{
															borderBottom:
																"1px solid #e0e0e0",
														}}
													>
														<td
															style={{
																padding: "12px",
																fontSize:
																	"14px",
															}}
														>
															{mapping.pii_name}
														</td>
														<td
															style={{
																padding: "12px",
																fontSize:
																	"14px",
																fontFamily:
																	"monospace",
															}}
														>
															{
																mapping.column_name
															}
														</td>
														<td
															style={{
																padding: "12px",
																textAlign:
																	"center",
															}}
														>
															<button
																onClick={() =>
																	handleRemoveNewMapping(
																		index,
																	)
																}
																style={{
																	padding:
																		"6px 12px",
																	backgroundColor:
																		"#6c757d",
																	color: "white",
																	border: "none",
																	borderRadius:
																		"4px",
																	cursor: "pointer",
																	fontSize:
																		"12px",
																}}
															>
																Remove
															</button>
														</td>
													</tr>
												),
											)}
										</tbody>
									</table>
								</div>
							)}
						</div>

						{/* Submit Button */}
						{newMappings.length > 0 && (
							<div style={{ marginBottom: "30px" }}>
								<button
									onClick={handleSubmit}
									disabled={loading}
									style={{
										padding: "12px 30px",
										backgroundColor:
											loading || !selectedAsset
												? "#ccc"
												: "#28a745",
										color: "white",
										border: "none",
										borderRadius: "4px",
										cursor:
											loading || !selectedAsset
												? "not-allowed"
												: "pointer",
										fontSize: "14px",
										fontWeight: "600",
									}}
								>
									{loading
										? "Submitting..."
										: "Save New Mappings"}
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
