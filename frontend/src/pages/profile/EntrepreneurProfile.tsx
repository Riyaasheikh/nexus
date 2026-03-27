import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MessageCircle, Users, Calendar, Building2, 
  MapPin, UserCircle, FileText, DollarSign, Send 
} from 'lucide-react';

// UI Components
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

// Hooks & Types
import { useAuth } from '../../context/AuthContext';
import { findUserById } from '../../data/users';
import { createCollaborationRequest, getRequestsFromInvestor } from '../../data/collaborationRequests';
import type { Entrepreneur } from '../../types'; // Fix: Use 'import type'

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  
  // Fetch data and cast to the specific Entrepreneur type
  const entrepreneur = findUserById(id || '') as Entrepreneur | null;
  
  // Milestone 1: Requirement to handle missing profiles [cite: 18, 28]
  if (!entrepreneur || entrepreneur.role !== 'entrepreneur') {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900">Profile Not Found</h2>
        <p className="text-gray-600 mt-2 text-center max-w-md">
          This entrepreneur profile may have been moved or the ID is incorrect.
        </p>
        <Link to="/dashboard/investor" className="mt-6">
          <Button variant="outline">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  const isCurrentUser = currentUser?.id === entrepreneur.id;
  const isInvestor = currentUser?.role === 'investor';
  
  // Milestone 3 logic: Check for existing collaboration requests [cite: 30, 32]
  const hasRequested = isInvestor && id 
    ? getRequestsFromInvestor(currentUser.id).some(req => req.entrepreneurId === id)
    : false;
  
  const handleSendRequest = async () => {
    if (isInvestor && currentUser && id) {
      try {
        await createCollaborationRequest(
          currentUser.id,
          id,
          `I'm interested in ${entrepreneur.startupName} and would like to discuss potential investment.`
        );
        // Refresh to show 'Request Sent' state
        window.location.reload();
      } catch (error) {
        console.error("Failed to send request:", error);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header Section */}
      <Card>
        <CardBody className="p-6 md:flex md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row items-center md:space-x-6 text-center md:text-left">
            <Avatar
              src={entrepreneur.avatarUrl}
              alt={entrepreneur.name}
              size="xl"
              status={entrepreneur.isOnline ? 'online' : 'offline'}
            />
            <div className="mt-4 md:mt-0">
              <h1 className="text-3xl font-bold text-gray-900">{entrepreneur.name}</h1>
              <div className="flex items-center justify-center md:justify-start mt-1 text-gray-600">
                <Building2 size={18} className="mr-2" />
                <span className="font-medium text-lg">Founder, {entrepreneur.startupName}</span>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                <Badge variant="primary">{entrepreneur.industry}</Badge>
                <Badge variant="gray"><MapPin size={14} className="mr-1" /> {entrepreneur.location}</Badge>
                <Badge variant="accent"><Calendar size={14} className="mr-1" /> Est. {entrepreneur.foundedYear}</Badge>
                <Badge variant="secondary"><Users size={14} className="mr-1" /> {entrepreneur.teamSize} Employees</Badge>
              </div>
            </div>
          </div>
          
          {/* Action Buttons: Role-Based logic  */}
          <div className="mt-6 md:mt-0 flex flex-wrap gap-3 justify-center">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${entrepreneur.id}`}>
                  <Button variant="outline" leftIcon={<MessageCircle size={18} />}>Message</Button>
                </Link>
                {isInvestor && (
                  <Button 
                    leftIcon={<Send size={18} />} 
                    disabled={hasRequested}
                    onClick={handleSendRequest}
                  >
                    {hasRequested ? 'Request Pending' : 'Collaborate'}
                  </Button>
                )}
              </>
            )}
            {isCurrentUser && (
              <Button variant="outline" leftIcon={<UserCircle size={18} />}>Edit My Profile</Button>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h2 className="text-xl font-semibold">About the Founder</h2></CardHeader>
            <CardBody><p className="text-gray-700 leading-relaxed">{entrepreneur.bio}</p></CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-xl font-semibold">Pitch Summary</h2></CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900">The Problem</h3>
                  <p className="text-gray-700 mt-1">
                    {entrepreneur.pitchSummary.split('.')[0]}.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">The Nexus Solution</h3>
                  <p className="text-gray-700 mt-1">{entrepreneur.pitchSummary}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar: Funding & Documents [cite: 41, 50] */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-white to-gray-50">
            <CardHeader><h2 className="text-xl font-semibold">Investment Goal</h2></CardHeader>
            <CardBody>
              <div className="flex items-center space-x-2 text-indigo-700 mb-4">
                <DollarSign size={24} />
                <span className="text-3xl font-bold">{entrepreneur.fundingNeeded}</span>
              </div>
              <p className="text-sm text-gray-500 italic">Targeting Series A completion by Q3 2026.</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-xl font-semibold">Document Chamber</h2></CardHeader>
            <CardBody className="space-y-3">
              {['Pitch Deck', 'Financial Forecast', 'Product Roadmap'].map((doc) => (
                <div key={doc} className="flex items-center justify-between p-3 border rounded-lg hover:border-indigo-300 transition-colors">
                  <div className="flex items-center">
                    <FileText className="text-indigo-600 mr-3" size={20} />
                    <span className="text-sm font-medium">{doc}</span>
                  </div>
                  <Button size="sm" variant="ghost">View</Button>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};