import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Rounds = ({ companyType, role }) => {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/companies/${encodeURIComponent(
            companyType
          )}/${encodeURIComponent(role)}/rounds`
        );
        setRounds(res.data.rounds || []);
      } catch (err) {
        console.error("Error fetching rounds:", err);
      } finally {
        setLoading(false);
      }
    };

    if (companyType && role) fetchRounds();
  }, [companyType, role]);

  if (loading)
    return (
      <div className="text-center text-gray-600 mt-10 text-lg">Loading rounds...</div>
    );

  return (
    <div className="p-8 sm:p-12 space-y-8 max-w-xl mx-auto flex flex-col items-center bg-white shadow-xl rounded-xl">
      <h2 className="text-2xl sm:text-3xl text-gray-800 font-light tracking-wider text-center">
        Interview Rounds
      </h2>
      <p className="text-gray-600 text-center text-lg mt-0 font-light max-w-sm">
        Rounds for{" "}
        <span className="font-semibold text-indigo-600">{companyType}</span>{" "}
        <br />
        and selected Role is{" "}
        <span className="font-semibold text-indigo-600">{role}</span>
      </p>

      <div className="w-full text-left space-y-3 p-4 border rounded-lg bg-gray-50">
        {rounds.length > 0 ? (
          rounds.map((round, index) => (
            <p key={index} className="text-gray-800 font-normal">
              <span className="font-bold text-indigo-700">
                {round.name}:
              </span>{" "}
              {round.description}
            </p>
          ))
        ) : (
          <p className="text-gray-500 italic">
            No rounds found for this role.
          </p>
        )}
      </div>

      <div className="flex justify-center space-x-4 mt-8 w-full">
        <button
          onClick={() => navigate(-1)}
          className="py-3 px-6 text-base font-normal rounded-full transition-all duration-300 border-2 border-gray-400 text-gray-700 bg-white hover:bg-gray-100"
        >
          &larr; Change Selection
        </button>
        <button
          onClick={() => alert("Interview Starting...")}
          className="py-3 px-8 text-lg font-normal rounded-full transition-all duration-300 border-2 border-indigo-700 bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:scale-[1.03]"
        >
          Start Practice Interview
        </button>
      </div>
    </div>
  );
};

export default Rounds;
