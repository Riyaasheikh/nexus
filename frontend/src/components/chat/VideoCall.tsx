import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { Button } from '../ui/Button';

// Connect to the Node.js Signaling Server
const socket = io('http://localhost:5000');

interface VideoCallProps {
  roomId: string;
  onHangUp: () => void;
}

export const VideoCall = ({ roomId, onHangUp }: VideoCallProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        // 1. Access Camera and Microphone
        const localStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setStream(localStream);
        if (myVideo.current) myVideo.current.srcObject = localStream;

        // 2. Initialize Peer Connection with multiple STUN servers for better reliability
        peerRef.current = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" }
          ]
        });

        // 3. Add local tracks to the peer connection
        localStream.getTracks().forEach(track => {
          peerRef.current?.addTrack(track, localStream);
        });

        // 4. Listen for Remote Stream
        peerRef.current.ontrack = (event) => {
          if (userVideo.current) {
            userVideo.current.srcObject = event.streams[0];
          }
        };

        // 5. Handle ICE Candidates (finding the network path)
        peerRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice_candidate", { 
              candidate: event.candidate, 
              room: roomId 
            });
          }
        };

        // 6. Socket Signaling Listeners
        socket.on("receive_offer", async (offer) => {
          if (peerRef.current) {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerRef.current.createAnswer();
            await peerRef.current.setLocalDescription(answer);
            socket.emit("send_answer", { answer, room: roomId });
          }
        });

        socket.on("receive_answer", async (answer) => {
          if (peerRef.current) {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        socket.on("receive_ice_candidate", async (candidate) => {
          try {
            if (peerRef.current) {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } catch (e) {
            console.error("Error adding received ice candidate:", e);
          }
        });

        // 7. Join Room and Initiate Handshake
        socket.emit("join_room", roomId);
        
        // Create an offer to send to the partner
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socket.emit("send_offer", { offer, room: roomId });

      } catch (err) {
        console.error("Hardware/Access Error:", err);
      }
    };

    initCall();

    // Cleanup when the call ends or component unmounts
    return () => {
      socket.off("receive_offer");
      socket.off("receive_answer");
      socket.off("receive_ice_candidate");
      
      // Stop the local camera stream
      stream?.getTracks().forEach(track => track.stop());
      
      // Close peer connection
      if (peerRef.current) {
        peerRef.current.close();
      }
    };
  }, [roomId]);

  // UI Control Handlers
  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // Toggle state
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff; // Toggle state
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-[100] flex flex-col items-center justify-center p-4">
      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl h-[70vh]">
        {/* Local Video Box */}
        <div className="relative bg-black rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-xl">
          <video 
            playsInline 
            muted 
            ref={myVideo} 
            autoPlay 
            className="w-full h-full object-cover" 
          />
          <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-xs font-medium">
            You (Local)
          </div>
        </div>

        {/* Remote Video Box */}
        <div className="relative bg-black rounded-2xl overflow-hidden border-2 border-gray-700 shadow-xl flex items-center justify-center">
          <video 
            playsInline 
            ref={userVideo} 
            autoPlay 
            className="w-full h-full object-cover" 
          />
          {!userVideo.current?.srcObject && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 text-sm">Connecting to partner...</p>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-xs font-medium">
            Partner (Remote)
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="mt-8 flex gap-6 p-4 bg-gray-800 rounded-full shadow-2xl border border-gray-700">
        <Button 
          variant="ghost" 
          onClick={toggleMute} 
          className={`rounded-full p-4 transition-colors ${isMuted ? 'bg-red-500/20 text-red-500' : 'text-white hover:bg-gray-700'}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </Button>

        <Button 
          variant="ghost" 
          onClick={toggleVideo} 
          className={`rounded-full p-4 transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'text-white hover:bg-gray-700'}`}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </Button>

        <Button 
          onClick={onHangUp} 
          className="bg-red-600 hover:bg-red-700 rounded-full p-4 text-white shadow-lg transition-transform active:scale-95"
        >
          <PhoneOff size={24} />
        </Button>
      </div>
    </div>
  );
};