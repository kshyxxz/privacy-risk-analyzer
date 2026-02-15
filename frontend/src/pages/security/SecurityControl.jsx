import React, { useEffect, useState } from "react";
import SecurityControlForm from "../../components/security/SecurityControlForm";
import SecurityControlTable from "../../components/security/SecurityControlTable";
import { getSecurityControls } from "../../services/securityService";

const SecurityControl = () => {
	const [controls, setControls] = useState([]);

	useEffect(() => {
		fetchControls();
	}, []);

	const fetchControls = async () => {
		const res = await getSecurityControls();
		setControls(res.data);
	};

	return (
		<div className="security-page">
			<h2>Security Control Management</h2>

			<SecurityControlForm refreshData={fetchControls} />

			<SecurityControlTable controls={controls} />
		</div>
	);
};

export default SecurityControl;
