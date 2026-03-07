import api from "../api/axiosConfig";

export const getAuditLogs = (filters = {}) => {
	return api.get("/audit", { params: filters });
};
