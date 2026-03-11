import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import LandingPage from "./pages/auth/LandingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/assets/Assets";
import Users from "./pages/users/Users";
import RiskAnalysis from "./pages/risk/RiskAnalysis";
import PiiTypes from "./pages/pii/PiiTypes";
import AddPiiType from "./pages/pii/AddPiiType";
import EditPiiType from "./pages/pii/EditPiiType";

import Permissions from "./pages/permissions/Permissions";
import AddPermission from "./pages/permissions/AddPermission";
import EditPermission from "./pages/permissions/EditPermission";

import AssignPiiToAsset from "./pages/pii/AssignPiiToAsset";

import AuditLogs from "./pages/audit/AuditLogs";
import SecurityControl from "./pages/security/SecurityControl";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					<Route path="/" element={<LandingPage />} />
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
					<Route
						path="/users"
						element={
							<ProtectedRoute>
								<Users />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/assets"
						element={
							<ProtectedRoute>
								<Assets />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/risk-analysis"
						element={
							<ProtectedRoute>
								<RiskAnalysis />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/pii-types"
						element={
							<ProtectedRoute>
								<PiiTypes />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/pii-types/add"
						element={
							<ProtectedRoute>
								<AddPiiType />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/pii-types/edit/:id"
						element={
							<ProtectedRoute>
								<EditPiiType />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/permissions"
						element={
							<ProtectedRoute>
								<Permissions />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/permissions/add"
						element={
							<ProtectedRoute>
								<AddPermission />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/permissions/edit/:id"
						element={
							<ProtectedRoute>
								<EditPermission />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/assign-pii"
						element={
							<ProtectedRoute>
								<AssignPiiToAsset />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/audit-logs"
						element={
							<ProtectedRoute>
								<AuditLogs />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/security-controls"
						element={
							<ProtectedRoute>
								<SecurityControl />
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<Navigate to="/" />} />
				</Routes>
			</Router>
		</AuthProvider>
	);
}

export default App;
