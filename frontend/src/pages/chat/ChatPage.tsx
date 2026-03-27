import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Phone, Video, MessageCircle, FileText, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';
import SignatureCanvas from 'react-signature-canvas';

// UI Components
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { VideoCall } from '../../components/chat/VideoCall'; 
import { DocumentPreview } from '../../components/documents/DocumentPreview';

// Hooks & Context
import { useAuth } from '../../context/AuthContext';
import { useInvestors } from '../../hooks/useInvestors';
import { useEntrepreneurs } from '../../hooks/useEntrepreneurs';
import type { Message } from '../../types';
import { getConversationsForUser } from '../../data/messages';

// 🟢 Connect to your Node.js Signaling Server
const socket = io('http://localhost:5000');

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  
  // 🟢 Dynamic Data Hooks (Fixes the "Sarah" name bug)
  const { investors } = useInvestors();
  const { entrepreneurs } = useEntrepreneurs();

  // States
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Milestone 4: Calling States
  const [isCalling, setIsCalling] = useState(false); 
  const [incomingCall, setIncomingCall] = useState<{fromName: string, roomId: string} | null>(null);

  // Milestone 5: Document States
  const [showDoc, setShowDoc] = useState(false);
  const [selectedDocUrl, setSelectedDocUrl] = useState('');
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const sigCanvas = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🟢 LOGIC: Find actual Partner from Database
  const chatPartner = useMemo(() => {
    return [...investors, ...entrepreneurs].find(u => u.id.toString() === userId);
  }, [investors, entrepreneurs, userId]);

  // 🟢 LOGIC: Get user conversations
  const conversations = useMemo(() => {
    return currentUser ? getConversationsForUser(currentUser.id.toString()) : [];
  }, [currentUser]);

  // Milestone 4: Room ID Generation
  const getRoomId = () => {
    if (!currentUser || !userId) return '';
    const sortedIds = [currentUser.id, userId].sort();
    return `chat-${sortedIds[0]}-${sortedIds[1]}`;
  };

  // 🟢 EFFECT: Socket Listeners & Initial Join
  useEffect(() => {
    if (currentUser) {
      socket.emit("join_room", currentUser.id); // Join personal room for incoming calls
    }

    socket.on("incoming_call_request", (data) => setIncomingCall(data));
    socket.on("call_rejected", () => {
        alert("Call was declined");
        setIsCalling(false);
    });

    return () => {
      socket.off("incoming_call_request");
      socket.off("call_rejected");
    };
  }, [currentUser]);

  // 🟢 EFFECT: Fetch Real Messages from Laravel
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser || !userId) return;
      setIsLoadingMessages(true);
      try {
        const token = localStorage.getItem('business_nexus_token');
        const response = await axios.get(`http://127.0.0.1:8000/api/messages/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(response.data);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [currentUser, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 🟢 HANDLER: Send Real Message to Laravel
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userId) return;

    try {
      const token = localStorage.getItem('business_nexus_token');
      const response = await axios.post('http://127.0.0.1:8000/api/messages', 
        { receiver_id: userId, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (err) {
      console.error("Message send failed:", err);
    }
  };

  // 🟢 HANDLER: Video Call Signaling
  const startCall = () => {
    if (!currentUser || !userId || !chatPartner) return;
    const roomId = getRoomId();
    setIsCalling(true);
    socket.emit("notify_incoming_call", { 
      to: userId, 
      from: currentUser.id, 
      fromName: currentUser.name, 
      roomId 
    });
  };

  // 🟢 MILESTONE 5: Document Upload & Sign
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', file.name);

    try {
      const token = localStorage.getItem('business_nexus_token');
      const response = await axios.post('http://127.0.0.1:8000/api/documents/upload', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setSelectedDocUrl(`http://127.0.0.1:8000/storage/${response.data.file_path}`);
      setShowDoc(true);
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="relative flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      
      {/* 📄 Milestone 5: Signature Overlay */}
      {showDoc && (
        <div className="fixed inset-0 z-[150] bg-black/80 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden relative shadow-2xl">
            <button onClick={() => setShowDoc(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-[160]"><X size={20} /></button>
            <div className="flex-1 overflow-hidden"><DocumentPreview fileUrl={selectedDocUrl} /></div>
            <div className="p-4 border-t bg-gray-50">
              <p className="text-sm font-bold mb-2 text-gray-700">Digital Signature:</p>
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg mb-3">
                <SignatureCanvas ref={sigCanvas} canvasProps={{className: "sigCanvas w-full h-32 cursor-crosshair"}} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowDoc(false)} className="flex-1">Sign & Send</Button>
                <Button variant="ghost" onClick={() => sigCanvas.current.clear()}>Clear</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 Milestone 4: Incoming Call Notification */}
      {incomingCall && (
        <div className="fixed top-20 right-4 bg-white shadow-2xl p-4 rounded-xl border-2 border-indigo-500 z-[200] animate-bounce w-72">
          <div className="flex items-center mb-3">
            <Phone className="text-indigo-600 animate-pulse mr-3" size={20} />
            <p className="font-bold text-gray-800">{incomingCall.fromName} is calling...</p>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 bg-green-600 text-white" onClick={() => { setIsCalling(true); setIncomingCall(null); }}>Accept</Button>
            <Button variant="ghost" className="flex-1 text-red-600" onClick={() => {
                socket.emit("reject_call", { room: incomingCall.roomId });
                setIncomingCall(null);
            }}>Decline</Button>
          </div>
        </div>
      )}

      {/* 📹 Milestone 4: Video Connection Overlay */}
      {isCalling && userId && (
        <VideoCall roomId={getRoomId()} onHangUp={() => {
            socket.emit("end_call", { room: getRoomId() });
            setIsCalling(false);
        }} />
      )}

      {/* Sidebar - Conversations */}
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
        <ChatUserList conversations={conversations} />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {chatPartner ? (
          <>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center bg-white">
              <div className="flex items-center">
                <Avatar src={chatPartner.avatarUrl} alt={chatPartner.name} size="md" status={chatPartner.isOnline ? 'online' : 'offline'} className="mr-3" />
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{chatPartner.name}</h2>
                  <p className="text-sm text-green-500 font-medium">{chatPartner.isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".pdf" />
                <Button variant="ghost" size="sm" className="rounded-full p-2" onClick={() => fileInputRef.current?.click()}><FileText size={18} /></Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2 text-indigo-600 hover:bg-indigo-50" onClick={startCall}><Video size={18} /></Button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {isLoadingMessages ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" /></div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map(message => (
                    <ChatMessage key={message.id} message={message} isCurrentUser={message.senderId === currentUser.id} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                   <MessageCircle size={32} className="mb-2" />
                   <p>No messages yet. Say hi to {chatPartner.name}!</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4 bg-white">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} fullWidth className="flex-1 border-none bg-gray-100 focus:ring-0" />
                <Button type="submit" size="sm" disabled={!newMessage.trim()} className="rounded-full p-2 w-10 h-10"><Send size={18} /></Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4 bg-gray-50 text-gray-500">
            <MessageCircle size={48} className="mb-4 text-indigo-100" />
            <p className="font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};