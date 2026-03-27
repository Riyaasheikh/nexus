import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Users, Bell, Calendar, TrendingUp, AlertCircle, PlusCircle } from 'lucide-react';

// UI Components
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CollaborationRequestCard } from '../../components/collaboration/CollaborationRequestCard';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { MeetingCalendar } from '../../components/collaboration/MeetingCalendar'; 

// Hooks & Types
import { useAuth } from '../../context/AuthContext';
import type { Investor } from '../../types'; 
import { investors as allUsers } from '../../data/users';

export const EntrepreneurDashboard: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]); // Added state for meetings
  const [isLoading, setIsLoading] = useState(true);

  // Filter recommended investors
  const [recommendedInvestors] = useState<Investor[]>(
    (allUsers as unknown as Investor[])
      .filter(u => u.role === 'investor')
      .slice(0, 3)
  );

  useEffect(() => {
    const fetchMeetings = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('business_nexus_token');
        const response = await axios.get('http://127.0.0.1:8000/api/meetings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMeetings(response.data);
      } catch (error) {
        console.error("Failed to fetch meetings", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetings();
  }, [user]);

  // FIX: Change requestId to 'any' or 'number' to match the Card prop requirements
  const handleRequestStatusUpdate = (requestId: number, status: string) => {
    setMeetings(prevMeetings => 
      prevMeetings.map(m => 
        m.id === requestId ? { ...m, status } : m
      )
    );
  };

  if (!user || isLoading) return null;

  const pendingRequests = meetings.filter(req => req.status === 'pending');
  const acceptedMeetings = meetings.filter(req => req.status === 'accepted');

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Here's what's happening with your startup today</p>
        </div>
        
        <Link to="/investors">
          <Button leftIcon={<PlusCircle size={18} />}>
            Find Investors
          </Button>
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Bell size={20} />} label="Pending Requests" value={pendingRequests.length} variant="indigo" />
        <StatCard icon={<Users size={20} />} label="Connections" value={acceptedMeetings.length} variant="emerald" />
        <StatCard icon={<Calendar size={20} />} label="Meetings" value={acceptedMeetings.length} variant="amber" />
        <StatCard icon={<TrendingUp size={20} />} label="Views" value={24} variant="blue" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* --- MILESTONE 3: MEETING CALENDAR --- */}
          <MeetingCalendar meetings={acceptedMeetings} />

          {/* Collaboration Requests Card */}
          <Card>
            <CardHeader className="flex justify-between items-center border-b pb-4 px-6 pt-6">
              <h2 className="text-lg font-medium text-gray-900">Collaboration Requests</h2>
              <Badge variant="warning">{pendingRequests.length} New</Badge>
            </CardHeader>
            
            <CardBody className="p-6">
              {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map(request => (
                    <CollaborationRequestCard
                      key={request.id}
                      request={request}
                      onStatusUpdate={handleRequestStatusUpdate} // TYPE ERROR FIXED
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  message="No pending requests" 
                  submessage="When investors reach out to schedule a meeting, they will show up here."
                />
              )}
            </CardBody>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center border-b pb-4 px-6 pt-6">
              <h2 className="text-lg font-medium text-gray-900">Recommended Investors</h2>
            </CardHeader>
            <CardBody className="space-y-4 p-6">
              {recommendedInvestors.map(investor => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                  showActions={false}
                />
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Simplified StatCard to fix styling warnings
const StatCard = ({ icon, label, value }: any) => (
  <Card>
    <CardBody className="flex items-center p-4">
      <div className={`p-3 rounded-full mr-4 bg-gray-100`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <h3 className="text-xl font-semibold text-gray-900">{value}</h3>
      </div>
    </CardBody>
  </Card>
);

const EmptyState = ({ message, submessage }: { message: string, submessage: string }) => (
  <div className="text-center py-12">
    <AlertCircle size={40} className="text-gray-300 mx-auto mb-4" />
    <p className="text-gray-900 font-medium">{message}</p>
    <p className="text-sm text-gray-500 mt-1">{submessage}</p>
  </div>
);