import React, { useState, useEffect } from "react";
import { getAssets } from "../../services/securityService";
import { getUsers } from "../../services/userService";

const AuditFilter = ({ setFilters }) => {
	const [assets, setAssets] = useState([]);
	const [users, setUsers] = useState([]);
	const [selectedAsset, setSelectedAsset] = useState("");
	const [selectedUser, setSelectedUser] = useState("");

	useEffect(() => {
		let mounted = true;

		(async () => {
			try {
				const [assetsRes, usersRes] = await Promise.all([
					getAssets(),
					getUsers(),
				]);

				if (!mounted) {
					return;
				}

				const resolvedAssets = Array.isArray(assetsRes?.data)
					? assetsRes.data
					: Array.isArray(assetsRes)
						? assetsRes
						: [];

				const resolvedUsers = Array.isArray(usersRes?.data)
					? usersRes.data
					: Array.isArray(usersRes)
						? usersRes
						: [];

				setAssets(resolvedAssets);
				setUsers(resolvedUsers);
			} catch (error) {
				console.error("Failed to load audit filter options:", error);
				if (mounted) {
					setAssets([]);
					setUsers([]);
				}
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

	const handleFilter = () => {
		setFilters({
			asset_id: selectedAsset || undefined,
			user_id: selectedUser || undefined,
		});
	};

	return (
		<div style={filterContainerStyle}>
			<h2 style={{ marginTop: 0, marginBottom: "15px" }}>Filter Logs</h2>
			<div
				style={{
					display: "flex",
					gap: "15px",
					flexWrap: "wrap",
					alignItems: "flex-end",
				}}
			>
				<div style={{ flex: "1", minWidth: "200px" }}>
					<label style={labelStyle}>User</label>
					<select
						value={selectedUser}
						onChange={(e) => setSelectedUser(e.target.value)}
						style={selectStyle}
					>
						<option value="">All Users</option>
						{users.map((u) => (
							<option key={u.user_id} value={u.user_id}>
								{u.username}
							</option>
						))}
					</select>
				</div>

				<div style={{ flex: "1", minWidth: "200px" }}>
					<label style={labelStyle}>Asset</label>
					<select
						value={selectedAsset}
						onChange={(e) => setSelectedAsset(e.target.value)}
						style={selectStyle}
					>
						<option value="">All Assets</option>
						{assets.map((a) => (
							<option key={a.asset_id} value={a.asset_id}>
								{a.asset_name}
							</option>
						))}
					</select>
				</div>

				<button onClick={handleFilter} style={buttonStyle}>
					Apply Filter
				</button>
			</div>
		</div>
	);
};

const filterContainerStyle = {
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
	minWidth: "120px",
};

export default AuditFilter;
