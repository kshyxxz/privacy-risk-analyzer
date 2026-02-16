import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Assets from "./components/Assets";
import AddAsset from "./pages/Addasset";
import EditAsset from "./pages/Editasset";

export default function App() {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("assets")) || [];
    setAssets(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("assets", JSON.stringify(assets));
  }, [assets]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Assets assets={assets} setAssets={setAssets} />}
        />
        <Route
          path="/add"
          element={<AddAsset assets={assets} setAssets={setAssets} />}
        />
        <Route
          path="/edit/:id"
          element={<EditAsset assets={assets} setAssets={setAssets} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
// import "./App.css";

// function App() {
//   const [count, setCount] = useState(0);

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   );
// }

// export default App;
