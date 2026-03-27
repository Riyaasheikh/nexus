import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, PieChart, Filter, Search, PlusCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EntrepreneurCard } from '../../components/enterpreneur/EntrepreneurCard';
import { useAuth } from '../../context/AuthContext';
import { entrepreneurs } from '../../data/users';

import { useMeetings } from '../../hooks/useMeetings';
import { CollaborationRequestCard } from '../../components/collaboration/CollaborationRequestCard';

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  
  const { meetings, isLoading: meetingsLoading, refresh } = useMeetings();

  if (!user) return null;

  // 🟢 FIX: Only show requests that REQUIRE MY ACTION (I am the receiver)
  const incomingPending = useMemo(() => 
    meetings.filter(m => m.receiver_id === user.id && m.status === 'pending'),
    [meetings, user.id]
  );

  // 🔵 INFO: Count requests I HAVE SENT (For the stats card)
  const sentPendingCount = useMemo(() => 
    meetings.filter(m => m.sender_id === user.id && m.status === 'pending').length,
    [meetings, user.id]
  );

  const filteredEntrepreneurs = entrepreneurs.filter(entrepreneur => {
    const matchesSearch = searchQuery === '' || 
      entrepreneur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.startupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.industry.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesIndustry = selectedIndustries.length === 0 || 
      selectedIndustries.includes(entrepreneur.industry);
    
    return matchesSearch && matchesIndustry;
  });
  
  const industries = Array.from(new Set(entrepreneurs.map(e => e.industry)));
  
  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investor Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}</p>
        </div>
        
        <Link to="/entrepreneurs">
          <Button leftIcon={<PlusCircle size={18} />}>Discover Startups</Button>
        </Link>
      </div>

      {/* 📊 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200">
          <CardBody className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-full mr-4 text-primary-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Startups</p>
              <h3 className="text-xl font-bold text-gray-900">{entrepreneurs.length}</h3>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-white border-gray-200">
          <CardBody className="flex items-center">
            <div className="p-3 bg-secondary-100 rounded-full mr-4 text-secondary-600">
              <PieChart size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Industries</p>
              <h3 className="text-xl font-bold text-gray-900">{industries.length}</h3>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-white border-gray-200">
          <CardBody className="flex items-center">
            <div className="p-3 bg-accent-100 rounded-full mr-4 text-accent-600">
              <Inbox size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Active Connections</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {meetings.filter(m => m.status === 'accepted').length}
                </h3>
                {sentPendingCount > 0 && (
                  <span className="text-xs text-amber-600 font-medium">
                    ({sentPendingCount} sent)
                  </span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 🔵 ACTION SECTION: Only shows Incoming Requests */}
      <section className="animate-slide-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Action Required: Meeting Invites 
            {incomingPending.length > 0 && (
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                {incomingPending.length}
              </span>
            )}
          </h2>
          {meetingsLoading && <Loader2 size={16} className="animate-spin text-primary-600" />}
        </div>

        {incomingPending.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomingPending.map(req => (
              <CollaborationRequestCard 
                key={req.id} 
                request={req} 
                onStatusUpdate={() => refresh()} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl text-center">
             <p className="text-gray-500 text-sm">You have no new meeting requests to respond to.</p>
          </div>
        )}
      </section>

      {/* 🔍 Search & Discovery */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Discover New Ventures</h2>
            <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <div className="flex gap-2 overflow-x-auto max-w-[300px] no-scrollbar">
                    {industries.map(industry => (
                    <Badge
                        key={industry}
                        variant={selectedIndustries.includes(industry) ? 'primary' : 'gray'}
                        className="cursor-pointer whitespace-nowrap"
                        onClick={() => toggleIndustry(industry)}
                    >
                        {industry}
                    </Badge>
                    ))}
                </div>
            </div>
        </div>

        <Input
            placeholder="Search by name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            startAdornment={<Search size={18} className="text-gray-400" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntrepreneurs.length > 0 ? (
                filteredEntrepreneurs.map(entrepreneur => (
                    <EntrepreneurCard key={entrepreneur.id} entrepreneur={entrepreneur} />
                ))
            ) : (
                <div className="col-span-full py-10 text-center text-gray-500">
                    No startups found matching your criteria.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};