import api from "../api/axiosConfig";

export const getSecurityControls = () => {
	return api.get("/security-controls");
};

export const updateSecurityControl = (data) => {
	return api.post("/security-controls", data);
};

export const getAssets = () => {
	return api.get("/assets");
};
