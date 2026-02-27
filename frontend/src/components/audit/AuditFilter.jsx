import React, { useState, useEffect } from "react";
import { getAssets } from "../../services/securityService";
import { getUsers } from "../../services/userService";

const AuditFilter = ({ setFilters }) => {
	const [assets, setAssets] = useState([]);
	const [users, setUsers] = useState([]);
	const [selectedAsset, setSelectedAsset] = useState("");
	const [selectedUser, setSelectedUser] = useState("");

	useEffect(() => {
		getAssets().then((res) => setAssets(res.data));
		getUsers().then((res) => setUsers(res.data));
	}, []);

	const handleFilter = () => {
		setFilters({
			asset_id: selectedAsset || undefined,
			user_id: selectedUser || undefined,
		});
	};

	return (
		<div className="audit-filter">
			<select onChange={(e) => setSelectedUser(e.target.value)}>
				<option value="">All Users</option>
				{users.map((u) => (
					<option key={u.user_id} value={u.user_id}>
						{u.username}
					</option>
				))}
			</select>

			<select onChange={(e) => setSelectedAsset(e.target.value)}>
				<option value="">All Assets</option>
				{assets.map((a) => (
					<option key={a.asset_id} value={a.asset_id}>
						{a.asset_name}
					</option>
				))}
			</select>

			<button onClick={handleFilter}>Apply Filter</button>
		</div>
	);
};

export default AuditFilter;
