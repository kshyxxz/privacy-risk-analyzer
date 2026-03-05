import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import PiiTypes from "./pages/PiiTypes";
import AddPiiType from "./pages/AddPiiType";
import EditPiiType from "./pages/EditPiiType";

import Permissions from "./pages/Permissions";
import AddPermission from "./pages/AddPermission";
import EditPermission from "./pages/EditPermission";

import AssignPiiToAsset from "./pages/AssignPiiToAsset";

import AuditLogs from "./pages/audit/AuditLogs";
import SecurityControl from "./pages/security/SecurityControl";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute>
							<Dashboard />
						</ProtectedRoute>
					}
				/>
				<Route path="*" element={<Navigate to="/login" />} />
				<Route path="/" element={<LandingPage />} />
				<Route path="/pii-types" element={<PiiTypes />} />
				<Route path="/pii-types/add" element={<AddPiiType />} />
				<Route path="/pii-types/edit/:id" element={<EditPiiType />} />
				<Route path="/permissions" element={<Permissions />} />
				<Route path="/permissions/add" element={<AddPermission />} />
				<Route
					path="/permissions/edit/:id"
					element={<EditPermission />}
				/>
				<Route path="/assign-pii" element={<AssignPiiToAsset />} />
				<Route path="/audit-logs" element={<AuditLogs />} />
				<Route
					path="/security-controls"
					element={<SecurityControl />}
				/>
			</Routes>
		</Router>
	);
}

export default App;
