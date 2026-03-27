import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Entrepreneur } from '../types';
import { entrepreneurs as staticData } from '../data/users'; // fallback

const API_BASE = 'http://127.0.0.1:8000';

export const useEntrepreneurs = () => {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>(staticData); // ✅ starts with static data, no blank flash
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntrepreneurs = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/api/entrepreneurs`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setEntrepreneurs(response.data); // ✅ replaces static data with real data
      } catch (err) {
        setError('Failed to load entrepreneurs');
        // static data remains as fallback — page still works
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntrepreneurs();
  }, []);

  return { entrepreneurs, isLoading, error };
};