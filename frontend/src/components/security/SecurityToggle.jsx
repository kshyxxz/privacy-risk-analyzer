import React from "react";

const SecurityToggle = ({ label, value, onChange }) => {
	return (
		<div
			className="toggle-container"
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-start",
				gap: "6px",
				width: "fit-content",
			}}
		>
			<label style={{ marginRight: 0 }}>{label}</label>
			<label className="switch">
				<input
					type="checkbox"
					checked={value}
					onChange={(e) => onChange(e.target.checked)}
				/>
				<span className="slider round"></span>
			</label>
		</div>
	);
};

export default SecurityToggle;
