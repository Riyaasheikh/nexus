import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink } from 'lucide-react';
import type { Investor } from '../../types'; 
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface InvestorCardProps {
  investor: Investor;
  showActions?: boolean;
}

export const InvestorCard: React.FC<InvestorCardProps> = ({
  investor,
  showActions = true
}) => {
  const navigate = useNavigate();

  const handleViewProfile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/profile/investor/${investor.id}`);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    navigate(`/chat/${investor.id}`);
  };

  return (
    <Card 
      hoverable 
      className="transition-all duration-300 h-full cursor-pointer flex flex-col"
      onClick={() => handleViewProfile()}
    >
      <CardBody className="flex flex-col flex-1">
        <div className="flex items-start">
          <Avatar
            src={investor.avatarUrl}
            alt={investor.name}
            size="lg"
            status={investor.isOnline ? 'online' : 'offline'}
            className="mr-4 bg-black text-white"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{investor.name}</h3>
            <p className="text-sm text-gray-500 mb-2">
              Investor • {investor.totalInvestments} deals
            </p>
            <div className="flex flex-wrap gap-1">
              {investor.investmentStage.map((stage, idx) => (
                <Badge key={idx} variant="secondary" size="sm">{stage}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Interests</h4>
          <div className="flex flex-wrap gap-1">
            {investor.investmentInterests.slice(0, 3).map((interest, idx) => (
              <Badge key={idx} variant="primary" size="sm">{interest}</Badge>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600 line-clamp-2 italic">"{investor.bio}"</p>

        <div className="mt-auto pt-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Avg. Ticket</span>
          <p className="text-sm font-semibold text-indigo-600">
            {investor.minimumInvestment} - {investor.maximumInvestment}
          </p>
        </div>
      </CardBody>

      {showActions && (
        <CardFooter className="border-t border-gray-100 bg-gray-50/50 flex gap-2 p-4">
          <Button variant="outline" size="sm" className="flex-1" leftIcon={<MessageCircle size={14} />} onClick={handleMessage}>
            Chat
          </Button>
          <Button variant="outline" size="sm" className="flex-1" rightIcon={<ExternalLink size={14} />} onClick={handleViewProfile}>
            Profile
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};