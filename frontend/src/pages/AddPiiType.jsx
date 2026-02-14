import { useState } from "react";
import API from "../api";

export default function AddPiiTypes() {
	const [form, setForm] = useState({
		pii_name: "",
		pii_category: "",
		pii_weight: "",
	});
	const handleSubmit = async (e) => {
		e.preventDefault();
		await API.post("/pii", form);
		alert("PII Created!");
	};

	return (
		<div>
			<form onSubmit={handleSubmit}>
				<input
					type="text"
					placeholder="PII Name"
					onChange={(e) =>
						setForm({ ...form, pii_name: e.target.value })
					}
				/>
				<input
					type="text"
					placeholder="PII Category"
					onChange={(e) =>
						setForm({ ...form, pii_category: e.target.value })
					}
				/>
				<input
					type="number"
					placeholder="PII Weight"
					onChange={(e) =>
						setForm({ ...form, pii_weight: e.target.value })
					}
				/>
				<button>Create</button>
			</form>
		</div>
	);
}
