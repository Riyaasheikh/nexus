import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { Building2, CircleDollarSign, AlertCircle, MapPin, Info } from 'lucide-react';
import type { UserRole } from '../../types';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'entrepreneur' as UserRole,
    bio: '',
    location: '',
    industry: '',
    startupName: ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const extractErrors = (err: any): string[] => {
    const data = err?.response?.data;
    if (data?.errors) return Object.values(data.errors).flat() as string[];
    return [data?.message || err?.message || 'Connection failed.'];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (formData.password !== formData.confirmPassword) {
      setErrors(['Passwords do not match.']);
      return;
    }

    setIsLoading(true);
    try {
      // Pass the entire formData object to your register function
      const newUser = await register(
        formData.name, 
        formData.email, 
        formData.password, 
        formData.role,
        { 
          bio: formData.bio, 
          location: formData.location, 
          industry: formData.industry, 
          startupName: formData.startupName 
        }
      );
      navigate(newUser.role === 'investor' ? '/dashboard/investor' : '/dashboard/entrepreneur');
    } catch (err: any) {
      setErrors(extractErrors(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6">
      <div className="bg-white py-8 px-10 shadow-xl sm:rounded-2xl sm:max-w-xl mx-auto w-full border border-gray-100">
        <h2 className="mb-2 text-center text-3xl font-black text-gray-900 tracking-tight">
          Join the Nexus
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm">Create your professional profile today</p>

        {errors.length > 0 && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            {errors.map((err, idx) => (
              <div key={idx} className="flex items-center gap-2 text-red-700 text-xs mb-1">
                <AlertCircle size={14} /> <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({...formData, role: 'entrepreneur'})}
              className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                formData.role === 'entrepreneur' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'
              }`}
            >
              <Building2 size={24} />
              <span className="text-xs font-bold uppercase">Entrepreneur</span>
            </button>

            <button
              type="button"
              onClick={() => setFormData({...formData, role: 'investor'})}
              className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                formData.role === 'investor' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'
              }`}
            >
              <CircleDollarSign size={24} />
              <span className="text-xs font-bold uppercase">Investor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <Input label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            <Input label="Confirm Password" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
          </div>

          <hr className="border-gray-100 my-2" />
          
          <div className="bg-gray-50 p-4 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Info size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Profile Details</span>
            </div>
            
            <textarea
              placeholder="Tell us about yourself or your mission..."
              className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {formData.role === 'entrepreneur' && (
                 <Input 
                   placeholder="Startup Name" 
                   value={formData.startupName} 
                   onChange={(e) => setFormData({...formData, startupName: e.target.value})} 
                   startAdornment={<Building2 size={16} className="text-gray-400" />}
                 />
               )}
               <Input 
                 placeholder={formData.role === 'entrepreneur' ? "Industry (e.g. AI, Fintech)" : "Interests (e.g. SaaS)"} 
                 value={formData.industry} 
                 onChange={(e) => setFormData({...formData, industry: e.target.value})} 
               />
            </div>
            <Input 
              placeholder="Location (City, Country)" 
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
              startAdornment={<MapPin size={16} className="text-gray-400" />}
            />
          </div>

          <Button type="submit" className="py-4 text-lg shadow-lg shadow-indigo-200" fullWidth isLoading={isLoading}>
            Create Professional Profile
          </Button>

          <p className="text-center text-sm text-gray-500">
            Already a member? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
};