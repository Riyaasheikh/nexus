import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Investor } from '../types';
import { investors as staticData } from '../data/users';
import { TOKEN_KEY } from '../context/AuthContext'; // 🟢 Import the key directly to avoid mistakes

const API_BASE = 'http://127.0.0.1:8000';

export const useInvestors = () => {
  // Start with static data as fallback so the UI isn't empty
  const [investors, setInvestors] = useState<Investor[]>(staticData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvestors = async () => {
      setIsLoading(true);
      try {
        // 🟢 Get the token using the EXACT same key as your AuthContext
        const token = localStorage.getItem(TOKEN_KEY); 

        const response = await axios.get(`${API_BASE}/api/investors`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        // 🟢 If successful, replace static data with real DB data
        setInvestors(response.data);
        setError(null);
      } catch (err: any) {
        console.error("Nexus API Error:", err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load live investors');
        // Keep staticData so the page still works
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestors();
  }, []);

  return { investors, isLoading, error };
};