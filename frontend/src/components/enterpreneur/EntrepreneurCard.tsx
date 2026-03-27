import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink, MapPin, Users as UsersIcon } from 'lucide-react';
// FIX: Using 'import type' prevents bundling issues with TS interfaces
import type { Entrepreneur } from '../../types';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface EntrepreneurCardProps {
  entrepreneur: Entrepreneur;
  showActions?: boolean;
}

export const EntrepreneurCard: React.FC<EntrepreneurCardProps> = ({
  entrepreneur,
  showActions = true
}) => {
  const navigate = useNavigate();
  
  // FIX: Explicitly handle MouseEvent to match Card component expectations
  const handleViewProfile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/profile/entrepreneur/${entrepreneur.id}`);
  };
  
  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the card's handleViewProfile from firing
    navigate(`/chat/${entrepreneur.id}`);
  };
  
  return (
    <Card 
      hoverable 
      className="transition-all duration-300 h-full cursor-pointer flex flex-col"
      onClick={(e) => handleViewProfile(e)}
    >
      <CardBody className="flex flex-col flex-1">
        <div className="flex items-start">
          <Avatar
            src={entrepreneur.avatarUrl}
            alt={entrepreneur.name}
            size="lg"
            status={entrepreneur.isOnline ? 'online' : 'offline'}
            className="mr-4 shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate mb-0.5">{entrepreneur.name}</h3>
            <p className="text-sm font-medium text-indigo-600 truncate mb-2">{entrepreneur.startupName}</p>
            
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant="primary" size="sm">{entrepreneur.industry}</Badge>
              <Badge variant="gray" size="sm">
                <MapPin size={12} className="mr-1" /> {entrepreneur.location}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Pitch</h4>
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {entrepreneur.pitchSummary}
          </p>
        </div>
        
        <div className="mt-auto pt-5 flex justify-between items-end border-t border-gray-50 mt-4">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Capital Needed</span>
            <p className="text-sm font-bold text-gray-900">{entrepreneur.fundingNeeded}</p>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Team</span>
            <p className="text-sm font-medium text-gray-700 flex items-center justify-end">
              <UsersIcon size={14} className="mr-1" /> {entrepreneur.teamSize}
            </p>
          </div>
        </div>
      </CardBody>
      
      {showActions && (
        <CardFooter className="border-t border-gray-100 bg-gray-50/50 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            leftIcon={<MessageCircle size={14} />}
            onClick={handleMessage}
          >
            Chat
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            rightIcon={<ExternalLink size={14} />}
            onClick={(e) => handleViewProfile(e)}
          >
            Details
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};