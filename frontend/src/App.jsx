// App.jsx ✅
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import SelectRolesAndCompany from "./pages/check-your-ability/SelectRolesAndCompany.jsx";
import Rounds from "./pages/check-your-ability/Rounds.jsx";
import InterviewScreen from "./pages/interview-page/InterviewScreen.jsx";

function App() {
  const [companyType, setCompanyType] = useState(null);
  const [role, setRole] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Routes>
        <Route
          path="/"
          element={
            <SelectRolesAndCompany
              companyType={companyType}
              setCompanyType={setCompanyType}
              role={role}
              setRole={setRole}
            />
          }
        />
        <Route
          path="/rounds"
          element={<Rounds companyType={companyType} role={role} />}
        />
        <Route
          path="/interview"
          element={<InterviewScreen companyType={companyType} role={role} />}
        />
      </Routes>
    </div>
  );
}

export default App;
