import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axiosConfig";

export default function AssignPiiToAsset() {
	const [assets, setAssets] = useState([]);
	const [piiTypes, setPiiTypes] = useState([]);
	const [selectedAsset, setSelectedAsset] = useState("");
	const [piiMappings, setPiiMappings] = useState([]);
	const [formInput, setFormInput] = useState({
		pii_id: "",
		column_name: "",
	});
	const [loading, setLoading] = useState(false);
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

	const handleAddMapping = (e) => {
		e.preventDefault();
		if (!formInput.pii_id || !formInput.column_name.trim()) {
			setError("Please fill in all fields");
			return;
		}

		const newMapping = {
			pii_id: formInput.pii_id,
			column_name: formInput.column_name.trim(),
			pii_name: piiTypes.find((p) => p.pii_id === formInput.pii_id)
				?.pii_name,
		};

		setPiiMappings([...piiMappings, newMapping]);
		setFormInput({ pii_id: "", column_name: "" });
		setError("");
	};

	const handleRemoveMapping = (index) => {
		setPiiMappings(piiMappings.filter((_, i) => i !== index));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!selectedAsset) {
			setError("Please select a data asset");
			return;
		}
		if (piiMappings.length === 0) {
			setError("Please add at least one PII mapping");
			return;
		}

		try {
			setLoading(true);
			setError("");
			setSuccess("");

			// Submit all mappings for the selected asset
			const payload = piiMappings.map((m) => ({
				asset_id: selectedAsset,
				pii_id: m.pii_id,
				column_name: m.column_name,
			}));

			await api.post("/asset-pii/assign", { mappings: payload });

			setSuccess("PII mappings assigned successfully!");
			setPiiMappings([]);
			setSelectedAsset("");
		} catch (err) {
			console.error("Failed to assign PII mappings:", err);
			setError(
				err.response?.data?.error ||
					"Failed to assign PII mappings. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	};

	const selectedAssetName = assets.find(
		(a) => a.asset_id === selectedAsset,
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
					PII Detection
				</h1>

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
						onChange={(e) => {
							setSelectedAsset(e.target.value);
							setPiiMappings([]);
							setError("");
						}}
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
							<h3 style={{ marginTop: 0, marginBottom: "16px" }}>
								Add PII Mapping for {selectedAssetName}
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

							{/* PII Mappings Table */}
							{piiMappings.length > 0 && (
								<div style={{ marginTop: "20px" }}>
									<h4
										style={{
											marginTop: 0,
											marginBottom: "12px",
										}}
									>
										Current Mappings
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
													backgroundColor: "#f9f9f9",
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
											{piiMappings.map(
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
																	handleRemoveMapping(
																		index,
																	)
																}
																style={{
																	padding:
																		"6px 12px",
																	backgroundColor:
																		"#dc3545",
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
						{piiMappings.length > 0 && (
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
										: "Submit PII Mappings"}
								</button>
							</div>
						)}
					</>
				)}

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
			</div>
		</div>
	);
}
