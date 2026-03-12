import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";

export default function PiiTypes() {
	const [pii, setPii] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState({
		pii_name: "",
		pii_category: "",
		pii_weight: "",
	});
	const [saving, setSaving] = useState(false);

	const fetchPii = async () => {
		try {
			setLoading(true);
			setError("");
			const res = await API.get("/pii");
			setPii(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			console.error("Failed to load PII types:", err);
			setError("Unable to load PII types right now.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPii();
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!form.pii_name || !form.pii_category || !form.pii_weight) {
			setError("All fields are required");
			return;
		}
		try {
			setSaving(true);
			setError("");
			await API.post("/pii", form);
			setForm({ pii_name: "", pii_category: "", pii_weight: "" });
			setShowForm(false);
			fetchPii();
		} catch (err) {
			console.error("Failed to create PII type:", err);
			setError(err.response?.data?.error || "Failed to create PII type");
		} finally {
			setSaving(false);
		}
	};

	const deletePii = async (id) => {
		if (!window.confirm("Are you sure you want to delete this PII type?")) {
			return;
		}
		try {
			await API.delete(`/pii/${id}`);
			setPii((prev) => prev.filter((item) => item.pii_id !== id));
		} catch (err) {
			console.error("Failed to delete PII type:", err);
			setError(err.response?.data?.error || "Failed to delete PII type.");
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
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "20px",
					}}
				>
					<h1 style={{ marginTop: 0, marginBottom: 0 }}>PII Types</h1>
					<button
						onClick={() => setShowForm(!showForm)}
						style={{
							padding: "10px 20px",
							fontSize: "14px",
							backgroundColor: showForm ? "#6c757d" : "#007bff",
							color: "white",
							border: "none",
							borderRadius: "5px",
							cursor: "pointer",
						}}
					>
						{showForm ? "Cancel" : "+ Add PII Type"}
					</button>
				</div>

				{error && <div style={errorStyle}>{error}</div>}

				{showForm && (
					<div style={formContainerStyle}>
						<h3 style={{ marginTop: 0, marginBottom: "15px" }}>
							Add New PII Type
						</h3>
						<form onSubmit={handleSubmit}>
							<div style={{ marginBottom: "15px" }}>
								<label style={labelStyle}>PII Name</label>
								<input
									type="text"
									value={form.pii_name}
									onChange={(e) =>
										setForm({
											...form,
											pii_name: e.target.value,
										})
									}
									style={inputStyle}
									placeholder="e.g., Social Security Number"
									required
								/>
							</div>

							<div style={{ marginBottom: "15px" }}>
								<label style={labelStyle}>Category</label>
								<input
									type="text"
									value={form.pii_category}
									onChange={(e) =>
										setForm({
											...form,
											pii_category: e.target.value,
										})
									}
									style={inputStyle}
									placeholder="e.g., Personal ID"
									required
								/>
							</div>

							<div style={{ marginBottom: "15px" }}>
								<label style={labelStyle}>
									Weight (Risk Score)
								</label>
								<input
									type="number"
									value={form.pii_weight}
									onChange={(e) =>
										setForm({
											...form,
											pii_weight: e.target.value,
										})
									}
									style={inputStyle}
									placeholder="e.g., 35"
									min="1"
									max="100"
									required
								/>
								<small
									style={{ color: "#666", fontSize: "12px" }}
								>
									Enter a value between 1-100 (higher = more
									sensitive)
								</small>
							</div>

							<button
								type="submit"
								disabled={saving}
								style={submitButtonStyle}
							>
								{saving ? "Creating..." : "Create PII Type"}
							</button>
						</form>
					</div>
				)}

				{loading && (
					<div style={{ color: "#666" }}>Loading PII types...</div>
				)}

				{!loading && !showForm && pii.length === 0 && (
					<div style={{ color: "#666" }}>No PII types found.</div>
				)}

				{!loading && pii.length > 0 && (
					<div style={tableContainerStyle}>
						<table
							style={{
								width: "100%",
								borderCollapse: "collapse",
							}}
						>
							<thead>
								<tr style={{ backgroundColor: "#f8f9fa" }}>
									<th style={cellHeaderStyle}>PII ID</th>
									<th style={cellHeaderStyle}>Name</th>
									<th style={cellHeaderStyle}>Category</th>
									<th style={cellHeaderStyle}>Weight</th>
									<th style={cellHeaderStyle}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{pii.map((item) => (
									<tr key={item.pii_id}>
										<td style={cellBodyStyle}>
											{item.pii_id}
										</td>
										<td style={cellBodyStyle}>
											{item.pii_name}
										</td>
										<td style={cellBodyStyle}>
											{item.pii_category}
										</td>
										<td style={cellBodyStyle}>
											{item.pii_weight}
										</td>
										<td style={cellBodyStyle}>
											<Link
												to={`/pii-types/edit/${item.pii_id}`}
												style={{
													marginRight: "10px",
													color: "#007bff",
													textDecoration: "none",
												}}
											>
												Edit
											</Link>
											<button
												onClick={() =>
													deletePii(item.pii_id)
												}
												style={{
													padding: "4px 8px",
													fontSize: "12px",
													backgroundColor: "#dc3545",
													color: "white",
													border: "none",
													borderRadius: "4px",
													cursor: "pointer",
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
			</div>
		</div>
	);
}

const formContainerStyle = {
	backgroundColor: "white",
	borderRadius: "8px",
	boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
	padding: "20px",
	marginBottom: "20px",
};

const labelStyle = {
	display: "block",
	marginBottom: "5px",
	fontSize: "14px",
	fontWeight: "500",
	color: "#333",
};

const inputStyle = {
	width: "100%",
	padding: "10px",
	fontSize: "14px",
	border: "1px solid #ddd",
	borderRadius: "5px",
	boxSizing: "border-box",
};

const submitButtonStyle = {
	padding: "10px 20px",
	fontSize: "14px",
	backgroundColor: "#28a745",
	color: "white",
	border: "none",
	borderRadius: "5px",
	cursor: "pointer",
	marginTop: "10px",
};

const tableContainerStyle = {
	backgroundColor: "white",
	borderRadius: "8px",
	boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
	overflowX: "auto",
};

const errorStyle = {
	padding: "12px",
	backgroundColor: "#ffe6e6",
	color: "#b00020",
	borderRadius: "6px",
	marginBottom: "16px",
};

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

