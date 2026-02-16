import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./editasset.module.css";

export default function EditAsset({ assets, setAssets }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({});

  useEffect(() => {
    const found = assets.find((a) => a.id === Number(id));
    if (found) setForm(found);
  }, [id, assets]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();

    setAssets(assets.map((a) => (a.id === Number(id) ? form : a)));

    navigate("/");
  }

  return (
    <div className={styles.container}>
      <h2>Edit Asset</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        {Object.keys(form).map(
          (key) =>
            key !== "id" && (
              <input
                key={key}
                className={styles.input}
                name={key}
                value={form[key] || ""}
                onChange={handleChange}
              />
            ),
        )}

        <button className={styles.button}>Update</button>
      </form>
    </div>
  );
}
