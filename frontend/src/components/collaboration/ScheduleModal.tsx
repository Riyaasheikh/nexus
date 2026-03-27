import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ScheduleModalProps {
  receiverId: string | number;
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ receiverId, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    start_time: '',
    end_time: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('business_nexus_token');
      await axios.post('http://127.0.0.1:8000/api/meetings', 
        { ...formData, receiver_id: receiverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Meeting Requested Successfully!');
      setFormData({ title: '', start_time: '', end_time: '' }); // Reset form
      onClose(); 
    } catch (err: any) {
      if (err.response && err.response.status === 422) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to schedule meeting. Check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule Meeting</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Meeting Title" 
            placeholder="e.g. Startup Pitch"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
            required 
          />
          <Input 
            label="Start Time" 
            type="datetime-local" 
            value={formData.start_time}
            onChange={(e) => setFormData({...formData, start_time: e.target.value})} 
            required 
          />
          <Input 
            label="End Time" 
            type="datetime-local" 
            value={formData.end_time}
            onChange={(e) => setFormData({...formData, end_time: e.target.value})} 
            required 
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
                Send Invite
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};