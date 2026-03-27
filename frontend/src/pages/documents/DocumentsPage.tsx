import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, Trash2, Eye, X, Loader2, CheckCircle, User, Send } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DocumentPreview } from '../../components/documents/DocumentPreview';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';

// ✅ Must match AuthContext.tsx exactly — was causing 401 on every request
const TOKEN_KEY = 'business_nexus_token';

interface DocumentItem {
  id: number;
  title: string;
  file_path: string;
  status: string;
  version: string;
  created_at: string;
  receiver?: {
    id: number;
    name: string;
  };
}

interface Investor {
  id: number;
  name: string;
}

type BadgeVariant = 'success' | 'warning' | 'gray';

const getStatusVariant = (status: string): BadgeVariant => {
  if (status === 'signed') return 'success';
  if (status === 'pending') return 'warning';
  return 'gray';
};

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments]               = useState<DocumentItem[]>([]);
  const [investors, setInvestors]               = useState<Investor[]>([]);
  const [selectedFile, setSelectedFile]         = useState<string | null>(null);
  const [activeDocId, setActiveDocId]           = useState<number | null>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>('');
  const [isLoading, setIsLoading]               = useState(true);
  const [isUploading, setIsUploading]           = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigCanvas    = useRef<any>(null);

  const API_BASE = 'http://127.0.0.1:8000';

  // ✅ Single helper — every axios call uses correct token key
  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`
  });

  // Fetch Documents
  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/documents`, {
        headers: authHeaders()
      });
      setDocuments(response.data);
    } catch (err) {
      console.error('Fetch documents error:', err);
    }
  };

  // Fetch Investors
  const fetchInvestors = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/investors`, {
        headers: authHeaders()
      });
      setInvestors(response.data);
    } catch (err) {
      console.error('Fetch investors error:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDocuments(), fetchInvestors()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Upload Logic with Investor Assignment
 const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !selectedInvestorId) return;

  setIsUploading(true);
  const formData = new FormData();
  
  // 🟢 Field names MUST match DocumentController.php validation
  formData.append('document', file); // Matches 'document' => 'required|mimes:pdf'
  formData.append('title', file.name); // Matches 'title' => 'required'
  formData.append('receiver_id', selectedInvestorId); // Matches 'receiver_id' => 'required'

  try {
    const token = localStorage.getItem(TOKEN_KEY);
    
    await axios.post(`${API_BASE}/api/documents`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data', // 🟢 Explicitly tell the server this is a file
        'Accept': 'application/json'
      }
    });

    await fetchDocuments();
    alert('Contract sent successfully!');
  } catch (error: any) {
    // 🔴 Log the exact error from Laravel's validator
    console.error('Full Error Response:', error.response?.data);
    alert(`Error: ${error.response?.data?.message || 'Check Console'}`);
  } finally {
    setIsUploading(false);
  }
};
  // Delete Logic
  const handleDelete = async (docId: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await axios.delete(`${API_BASE}/api/documents/${docId}`, {
        headers: authHeaders()
      });
      setDocuments(prev => prev.filter(d => d.id !== docId));
      alert('Document deleted.');
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete document.');
    }
  };

  // Preview Document
  const handlePreview = (doc: DocumentItem) => {
    setSelectedFile(`${API_BASE}/storage/${doc.file_path}`);
    setActiveDocId(doc.id);
  };

  // Close Preview
  const handleClosePreview = () => {
    setSelectedFile(null);
    setActiveDocId(null);
    if (sigCanvas.current) sigCanvas.current.clear();
  };

  // Save Signature
  const handleSaveSignature = async () => {
    if (!sigCanvas.current || !activeDocId) {
      alert('Please draw a signature first.');
      return;
    }

    if (!sigCanvas.current.isEmpty()) {
      const signatureImage = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');

      try {
        await axios.post(
          `${API_BASE}/api/documents/${activeDocId}/sign`,
          { signature: signatureImage },
          { headers: authHeaders() }
        );

        setDocuments(prev => prev.map(d =>
          d.id === activeDocId ? { ...d, status: 'signed' } : d
        ));
        alert('Document signed successfully!');
        handleClosePreview();
      } catch (error: any) {
        console.error('Signature failed:', error);
        if (error.response?.status === 403) {
          alert('You are not authorized to sign this document!');
        } else {
          alert('Failed to save signature.');
        }
      }
    } else {
      alert('Please draw your signature first.');
    }
  };

  // Clear Signature
  const clearSignature = () => {
    if (sigCanvas.current) sigCanvas.current.clear();
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        className="hidden"
        accept=".pdf"
      />

      {/* PDF PREVIEW & SIGNATURE OVERLAY */}
      {selectedFile && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl relative overflow-hidden">
            <button
              onClick={handleClosePreview}
              className="absolute top-4 right-4 p-3 hover:bg-gray-100 rounded-xl z-[160] transition-colors"
              title="Close"
            >
              <X size={24} className="text-gray-600" />
            </button>

            <div className="flex-1 overflow-hidden p-4">
              <DocumentPreview fileUrl={selectedFile} />
            </div>

            {/* Signature Pad Section */}
            <div className="p-8 border-t bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex justify-between items-start gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-100 rounded-2xl">
                      <CheckCircle size={28} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">Electronic Signature</p>
                      <p className="text-sm text-gray-600">Draw your signature below</p>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden shadow-sm">
                    <SignatureCanvas
                      ref={sigCanvas}
                      canvasProps={{
                        className: 'w-full h-36 cursor-crosshair bg-gray-50',
                        style: { minHeight: '144px' }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Click "Clear Pad" to start over
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-52 shrink-0">
                  <Button
                    onClick={handleSaveSignature}
                    className="w-full h-12 font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    leftIcon={<Send size={18} />}
                  >
                    Sign Document
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearSignature}
                    className="w-full h-12 border-gray-300 hover:bg-gray-50"
                  >
                    Clear Pad
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Document Chamber
          </h1>
          <p className="text-gray-600 mt-1">Send contracts to investors & collect e-signatures</p>
        </div>
      </div>

      {/* Investor Selection & Upload */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border-2 border-indigo-100 shadow-lg">
        <div className="flex-1">
          <label className="block text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
            <User size={16} className="text-indigo-600" />
            Select Investor
          </label>
          <select
            value={selectedInvestorId}
            onChange={(e) => setSelectedInvestorId(e.target.value)}
            className="w-full p-4 rounded-xl border-2 border-indigo-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-white/80 text-lg font-medium shadow-sm transition-all"
            disabled={isUploading}
          >
            <option value="">-- Choose Investor to Sign --</option>
            {investors.map(inv => (
              <option key={inv.id} value={inv.id.toString()}>
                {inv.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={() => fileInputRef.current?.click()}
          leftIcon={<Upload size={20} />}
          disabled={!selectedInvestorId || isUploading}
          className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Sending...
            </>
          ) : (
            'Send Contract'
          )}
        </Button>
      </div>

      {/* Documents Grid */}
      <Card className="shadow-xl border-0">
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
          ) : documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-8">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="group p-6 border-2 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-indigo-300 hover:-translate-y-1 border-gray-100 relative overflow-hidden"
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                    <Badge
                      size="sm"
                      variant={getStatusVariant(doc.status)}
                      className="font-bold px-3 py-1 shadow-md"
                    >
                      {doc.status.toUpperCase()}
                    </Badge>
                    {doc.receiver && (
                      <span className="text-xs font-mono text-gray-400 bg-white/60 px-2 py-1 rounded-full shadow-sm">
                        {doc.receiver.name}
                      </span>
                    )}
                  </div>

                  {/* Icon */}
                  <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                    <FileText size={36} className="text-indigo-600 mx-auto" />
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-xl text-gray-900 line-clamp-2 group-hover:text-indigo-900 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      Added {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-6 border-t border-gray-100 mt-6">
                    <Button
                      variant="ghost"
                      className="flex-1 h-12 text-indigo-600 hover:bg-indigo-50 font-bold text-sm shadow-sm hover:shadow-md transition-all"
                      onClick={() => handlePreview(doc)}
                    >
                      <Eye size={18} className="mr-2" />
                      Preview & Sign
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-12 w-12 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                      onClick={() => handleDelete(doc.id)}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 text-gray-400 border-2 border-dashed rounded-3xl border-gray-200 p-12">
              <FileText className="mx-auto mb-6 opacity-20" size={80} />
              <h3 className="text-2xl font-bold text-gray-500 mb-2">Chamber is Empty</h3>
              <p className="text-lg mb-8">Select an investor and upload your first contract</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <span className="text-sm text-gray-400">Ready when you are →</span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
