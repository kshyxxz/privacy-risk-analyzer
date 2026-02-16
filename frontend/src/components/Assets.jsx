import { Link } from "react-router-dom";
import styles from "./assets.module.css";

export default function Assets({ assets, setAssets }) {
  function handleDelete(id) {
    setAssets(assets.filter((a) => a.id !== id));
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Data Assets</h2>

      <Link to="/add">
        <button className={styles.button}>Add Asset</button>
      </Link>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Asset ID</th>
            <th>Name</th>
            <th>DB</th>
            <th>Table</th>
            <th>Sensitivity</th>
            <th>Contains PII</th>
            <th>Encryption</th>
            <th>Masking</th>
            <th>Hashing</th>
            <th>Risk Score</th>
            <th>Risk Level</th>
            <th>Last Analyzed</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td>{asset.id}</td>
              <td>{asset.name}</td>
              <td>{asset.db}</td>
              <td>{asset.table}</td>
              <td>{asset.sensitivity}</td>
              <td>{asset.pii}</td>
              <td>{asset.encryption}</td>
              <td>{asset.masking}</td>
              <td>{asset.hashing}</td>
              <td>{asset.riskScore}</td>
              <td>{asset.riskLevel}</td>
              <td>{asset.lastAnalyzed}</td>

              <td>
                <div className={styles.actions}>
                  <Link to={`/edit/${asset.id}`}>
                    <button className={styles.button}>Edit</button>
                  </Link>

                  <button
                    className={styles.button}
                    onClick={() => handleDelete(asset.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
