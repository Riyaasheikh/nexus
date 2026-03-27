import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CollaborationRequestCardProps {
  request: any; 
  onStatusUpdate?: (requestId: number, status: string) => void;
}

export const CollaborationRequestCard: React.FC<CollaborationRequestCardProps> = ({
  request,
  onStatusUpdate,
}) => {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  const partner = request.sender || { name: 'Unknown', avatarUrl: '' };

  const handleStatusUpdate = async (newStatus: 'accepted' | 'rejected') => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('business_nexus_token');
      
      await axios.patch(
        `http://127.0.0.1:8000/api/meetings/${request.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Request ${newStatus} successfully!`);
      if (onStatusUpdate) onStatusUpdate(request.id, newStatus);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'accepted': return <Badge variant="success">Accepted</Badge>;
      case 'rejected': return <Badge variant="error">Declined</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Avatar src={partner.avatarUrl} alt={partner.name} size="md" className="mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">{partner.name}</h3>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
        <div className="mt-4 bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-700 font-medium">{request.title}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(request.start_time).toLocaleString()}
          </p>
        </div>
      </CardBody>
      
      <CardFooter className="bg-gray-50/50">
        {request.status === 'pending' ? (
          <div className="flex justify-between w-full gap-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isUpdating}
              >
                Decline
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => handleStatusUpdate('accepted')}
                disabled={isUpdating}
              >
                Accept
              </Button>
            </div>
            <Button size="sm" onClick={() => navigate(`/chat/${request.sender_id}`)}>
              Message
            </Button>
          </div>
        ) : (
          <Button fullWidth variant="outline" onClick={() => navigate(`/chat/${request.sender_id}`)}>
            Open Chat
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};