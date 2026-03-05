export default function StatCard({ title, value, icon, bgColor = "#007bff" }) {
	return (
		<div
			style={{
				padding: "20px",
				backgroundColor: "white",
				borderRadius: "8px",
				boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
				textAlign: "center",
				minWidth: "200px",
			}}
		>
			<div
				style={{
					fontSize: "40px",
					marginBottom: "10px",
					color: bgColor,
				}}
			>
				{icon}
			</div>
			<p
				style={{
					fontSize: "14px",
					color: "#888",
					margin: "0 0 10px 0",
					textTransform: "uppercase",
				}}
			>
				{title}
			</p>
			<h3
				style={{
					fontSize: "28px",
					fontWeight: "bold",
					color: "#333",
					margin: 0,
				}}
			>
				{value}
			</h3>
		</div>
	);
}
