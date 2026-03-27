import React, { useState, useMemo } from 'react';
import { Search, Filter, MapPin, Loader2, Calendar } from 'lucide-react';

// UI Components
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EntrepreneurCard } from '../../components/enterpreneur/EntrepreneurCard';

// Hooks & Types
import { useEntrepreneurs } from '../../hooks/useEntrepreneurs';
import type { Entrepreneur } from '../../types';
import { ScheduleModal } from '../../components/collaboration/ScheduleModal';

export const EntrepreneursPage: React.FC = () => {
  // 🟢 DYNAMIC DATA HOOK
  const { entrepreneurs: dynamicEntrepreneurs, isLoading } = useEntrepreneurs();
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedFundingRange, setSelectedFundingRange] = useState<string[]>([]);

  // 🔵 MEETING MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | number | null>(null);
  
  // 🟢 INDUSTRIES: Derived from Dynamic Data
  const allIndustries = useMemo(() => 
    Array.from(new Set(dynamicEntrepreneurs.map(e => e.industry || 'Other'))), 
    [dynamicEntrepreneurs]
  );
  
  const fundingRanges = ['< $500K', '$500K - $1M', '$1M - $5M', '> $5M'];
  
  const filteredEntrepreneurs = useMemo(() => {
    return dynamicEntrepreneurs.filter(entrepreneur => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        entrepreneur.name.toLowerCase().includes(searchLower) ||
        (entrepreneur.startupName?.toLowerCase().includes(searchLower)) ||
        (entrepreneur.industry?.toLowerCase().includes(searchLower));
      
      const matchesIndustry = selectedIndustries.length === 0 ||
        (entrepreneur.industry && selectedIndustries.includes(entrepreneur.industry));
      
      const matchesFunding = selectedFundingRange.length === 0 || 
        selectedFundingRange.some(range => {
          if (!entrepreneur.fundingNeeded) return false;
          const amountStr = entrepreneur.fundingNeeded.toUpperCase();
          let amount = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
          if (amountStr.includes('M')) amount *= 1000;

          switch (range) {
            case '< $500K': return amount < 500;
            case '$500K - $1M': return amount >= 500 && amount <= 1000;
            case '$1M - $5M': return amount > 1000 && amount <= 5000;
            case '> $5M': return amount > 5000;
            default: return true;
          }
        });
      
      return matchesSearch && matchesIndustry && matchesFunding;
    });
  }, [dynamicEntrepreneurs, searchQuery, selectedIndustries, selectedFundingRange]);

  const toggleFilter = (item: string, state: string[], setState: React.Dispatch<React.SetStateAction<string[]>>) => {
    const isAlreadySelected = state.includes(item);
    setState(prev => isAlreadySelected ? prev.filter(i => i !== item) : [...prev, item]);
  };

  // 🔵 HELPER: Open meeting modal for a specific user
  const handleScheduleMeeting = (id: string | number) => {
    setSelectedUserId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Startups</h1>
          <p className="text-gray-600">Connect with Entrepreneurs scaling the next big thing</p>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Filters</h2></CardHeader>
            <CardBody className="space-y-6">
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 animate-pulse">
                  <Loader2 size={12} className="animate-spin" /> Updating lists...
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                   <MapPin size={16} className="mr-2 text-primary-500" /> Industry
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allIndustries.map(industry => (
                    <Badge
                      key={industry}
                      variant={selectedIndustries.includes(industry) ? 'primary' : 'gray'}
                      rounded
                      className="cursor-pointer"
                      onClick={() => toggleFilter(industry, selectedIndustries, setSelectedIndustries)}
                    >
                      {industry}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Funding Goal</h3>
                <div className="space-y-2">
                  {fundingRanges.map(range => (
                    <button
                      key={range}
                      onClick={() => toggleFilter(range, selectedFundingRange, setSelectedFundingRange)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedFundingRange.includes(range)
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </aside>
        
        <main className="lg:col-span-3 space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search by name, industry, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startAdornment={<Search size={18} className="text-gray-400" />}
                fullWidth
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
              <Filter size={18} />
              <span>{filteredEntrepreneurs.length} Results Found</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEntrepreneurs.map(entrepreneur => (
              <div key={entrepreneur.id} className="relative group">
                <EntrepreneurCard
                  entrepreneur={entrepreneur as Entrepreneur}
                />
                {/* 🔵 Professional Meeting Trigger overlay or separate button */}
                <div className="mt-2">
                   <Button 
                    fullWidth 
                    variant="outline" 
                    size="sm"
                    className="flex items-center justify-center gap-2"
                    onClick={() => handleScheduleMeeting(entrepreneur.id)}
                  >
                    <Calendar size={14} /> Schedule Meeting
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredEntrepreneurs.length === 0 && !isLoading && (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500">No startups found for your specific search criteria.</p>
              <Button 
                variant="ghost" 
                className="mt-2 text-primary-600"
                onClick={() => {setSelectedIndustries([]); setSelectedFundingRange([]); setSearchQuery('');}}
              >
                Reset All Filters
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* 🔵 THE MODAL (Single instance, controlled by state) */}
      {selectedUserId && (
        <ScheduleModal 
          receiverId={selectedUserId} 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUserId(null);
          }} 
        />
      )}
    </div>
  );
};