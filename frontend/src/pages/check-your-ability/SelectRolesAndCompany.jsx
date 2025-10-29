import React, { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


// --- Reusable Component: SelectionButton ---
const SelectionButton = ({
  value,
  options,
  onSelect,
  disabled = false,
  placeholder,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [roleWarning, setRoleWarning] = useState(false);
  const ref = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const displayValue = value || placeholder;

  return (
    <div className={`relative w-96 max-w-full overflow-visible ${className}`} ref={ref}>
      {/* Main Button */}
      <button
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          } else {
            setRoleWarning(true);
            setTimeout(() => setRoleWarning(false), 3000);
          }
        }}
        className={`
          w-full p-3 text-center border-2 shadow-md transition-all duration-200 rounded-lg
          ${
            disabled
              ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-400 hover:bg-gray-50"
          }
        `}
        disabled={disabled}
      >
        <span className={`${!value && "text-gray-500"}`}>{displayValue}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && options.length > 0 && (
        <div
          className="
            absolute z-[9999] w-full mt-1 bg-white border border-gray-300 shadow-xl 
            max-h-60 overflow-y-auto rounded-lg animate-fadeIn
          "
        >
          {options.map((option) => (
            <div
              key={option}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(option);
                setIsOpen(false);
              }}
              className={`
                p-3 text-gray-800 cursor-pointer hover:bg-indigo-50 
                flex items-center justify-between
                ${value === option ? "bg-indigo-100 font-semibold" : ""}
              `}
            >
              {option}
              {value === option && <Check className="w-4 h-4 text-indigo-600" />}
            </div>
          ))}
        </div>
      )}

      {/* Warning Message */}
      {roleWarning && disabled && (
        <p className="text-red-500 text-sm text-center mt-2 transition-opacity duration-300">
          Please select a Company Type first.
        </p>
      )}
    </div>
  );
};

// --- Main Component: SelectRolesAndCompany ---
const SelectRolesAndCompany = ({
  companyType,
  setCompanyType,
  role,
  setRole,
  startInterview,
}) => {
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate(); 

  // ✅ Fetch all companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/companies");
        if (Array.isArray(res.data)) {
          setCompanies(res.data);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  // ✅ Fetch roles of selected company
  useEffect(() => {
    const fetchRoles = async () => {
      if (!companyType) {
        setRoles([]);
        return;
      }

      try {
        const res = await axios.get(
          `http://localhost:5000/api/companies/roles/${encodeURIComponent(companyType)}`
        );

        if (Array.isArray(res.data)) {
          const roleNames = res.data.map((r) =>
            typeof r === "string" ? r : r.name
          );
          setRoles(roleNames);
        } else {
          setRoles([]);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        setRoles([]);
      }
    };

    fetchRoles();
  }, [companyType]);

  const isReadyToStart = companyType && role;

  const handleCompanySelect = (type) => {
    setCompanyType(type);
    setRole(null);
  };

  const handleRoleSelect = (selectedRole) => {
    if (companyType) setRole(selectedRole);
  };

  return (
    <div className="p-8 sm:p-12 space-y-8 max-w-xl mx-auto flex flex-col items-center bg-white shadow-xl rounded-xl">
      <h2 className="text-2xl sm:text-3xl text-gray-800 font-light tracking-wider">
        Check Your Ability
      </h2>
      <p className="text-gray-600 text-center text-lg mt-0 mb-8 font-light">
        Select preferred company type & Role below
      </p>

      <div className="space-y-4 w-full flex flex-col items-center">
        {/* Company Dropdown */}
        <SelectionButton
          placeholder="Select Your Company Type"
          value={companyType}
          options={companies}
          onSelect={handleCompanySelect}
        />

        {/* Role Dropdown */}
        <SelectionButton
          placeholder="Select Your Role"
          value={role}
          options={roles}
          onSelect={handleRoleSelect}
          disabled={!companyType}
        />
      </div>

      {/* Start Button */}
      <button
  onClick={() => {
    if (companyType && role) {
      navigate("/rounds"); // ✅ Redirect to rounds page
    }
  }}
  className={`
    mt-12 py-3 px-8 text-lg font-normal rounded-full transition-all duration-300 border-2
    ${
      companyType && role
        ? "bg-indigo-600 text-white border-indigo-700 shadow-lg hover:bg-indigo-700 hover:scale-[1.03]"
        : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
    }
  `}
  disabled={!companyType || !role}
>
  Click To Start Your Interview
</button>

    </div>
  );
};

export default SelectRolesAndCompany;
