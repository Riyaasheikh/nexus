import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { ChatConversation } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { findUserById } from '../../data/users';
import { useAuth } from '../../context/AuthContext';

interface ChatUserListProps {
  conversations: ChatConversation[];
}

export const ChatUserList: React.FC<ChatUserListProps> = ({ conversations }) => {
  const navigate = useNavigate();
  const { userId: activeUserId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  
  if (!currentUser) return null;

  return (
    <div className="bg-white border-r border-gray-200 w-full md:w-80 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Direct Messages</h2>
        {/* FIX: Using 'gray' variant which is now defined in Badge */}
        <Badge variant="gray" size="sm" rounded>{conversations.length}</Badge>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {conversations.map(conversation => {
              const otherId = conversation.participants.find(id => id !== currentUser.id);
              if (!otherId) return null;
              
              const otherUser = findUserById(otherId);
              if (!otherUser) return null;
              
              const lastMsg = conversation.lastMessage;
              const isActive = activeUserId === otherId;
              const isUnread = lastMsg && !lastMsg.isRead && lastMsg.senderId !== currentUser.id;

              return (
                <button
                  key={conversation.id}
                  onClick={() => navigate(`/chat/${otherUser.id}`)}
                  className={`w-full text-left px-4 py-4 flex items-center transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 border-r-4 border-indigo-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar
                    src={otherUser.avatarUrl}
                    alt={otherUser.name}
                    size="md"
                    status={otherUser.isOnline ? 'online' : 'offline'}
                    className="mr-3 shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {otherUser.name}
                      </h3>
                      {lastMsg && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          {formatDistanceToNow(new Date(lastMsg.timestamp), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      {lastMsg ? (
                        <p className={`text-xs truncate max-w-[140px] ${isUnread ? 'text-indigo-900 font-semibold' : 'text-gray-500'}`}>
                          {lastMsg.senderId === currentUser.id ? 'You: ' : ''}
                          {lastMsg.content}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No messages yet</p>
                      )}
                      
                      {/* FIX: Unread badge logic */}
                      {isUnread && (
                        <Badge variant="primary" size="sm" rounded className="ml-2">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-20 text-center">
            <p className="text-sm text-gray-400">No active conversations.</p>
          </div>
        )}
      </div>
    </div>
  );
};