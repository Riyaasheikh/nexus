import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from '../../types';
import { Avatar } from '../ui/Avatar';
import { findUserById } from '../../data/users';

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isCurrentUser }) => {
  // Memoize user lookup for performance during fast messaging
  const sender = useMemo(() => findUserById(message.senderId), [message.senderId]);
  
  if (!sender) return null;

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4 px-4 animate-fade-in`}>
      {/* Show other user's avatar on the left */}
      {!isCurrentUser && (
        <Avatar
          src={sender.avatarUrl}
          alt={sender.name}
          size="sm"
          className="mr-3 self-end shadow-sm"
        />
      )}
      
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div
          className={`px-4 py-2 rounded-2xl shadow-sm ${
            isCurrentUser
              ? 'bg-primary-600 text-white rounded-br-none'
              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        
        <span className="text-[10px] text-gray-400 mt-1 uppercase font-medium tracking-tighter">
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </span>
      </div>

      {/* Show current user's avatar on the right */}
      {isCurrentUser && (
        <Avatar
          src={sender.avatarUrl}
          alt={sender.name}
          size="sm"
          className="ml-3 self-end shadow-sm"
        />
      )}
    </div>
  );
};