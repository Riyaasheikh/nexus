import { useState, useEffect } from 'react';
import axios from 'axios';
import { TOKEN_KEY } from '../context/AuthContext';

export const useMeetings = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.get('http://127.0.0.1:8000/api/meetings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetings(response.data);
    } catch (err) {
      console.error("Meeting Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMeetings(); }, []);

  return { meetings, isLoading, refresh: fetchMeetings };
};