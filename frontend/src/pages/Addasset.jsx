import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./addasset.module.css";

export default function AddAsset({ assets, setAssets }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    db: "",
    table: "",
    sensitivity: "",
    pii: "",
    encryption: "",
    masking: "",
    hashing: "",
    riskScore: "",
    riskLevel: "",
    lastAnalyzed: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setAssets([...assets, { id: Date.now(), ...form }]);
    navigate("/");
  }

  return (
    <div className={styles.container}>
      <h2>Add Asset</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        {Object.keys(form).map((key) => (
          <input
            key={key}
            className={styles.input}
            name={key}
            placeholder={key}
            onChange={handleChange}
          />
        ))}

        <button className={styles.button}>Save</button>
      </form>
    </div>
  );
}
