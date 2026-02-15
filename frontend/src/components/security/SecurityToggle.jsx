import React from "react";

const SecurityToggle = ({ label, value, onChange }) => {
	return (
		<div className="toggle-container">
			<label>{label}</label>
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
