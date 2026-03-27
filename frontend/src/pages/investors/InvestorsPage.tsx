import React, { useState, useMemo } from 'react';
import { Search, Filter, Loader2, Calendar } from 'lucide-react';

// Hooks
import { useMeetings } from '../../hooks/useMeetings';
import { useInvestors } from '../../hooks/useInvestors';

// UI Components
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { ScheduleModal } from '../../components/collaboration/ScheduleModal';

export const InvestorsPage: React.FC = () => {
  const { investors: dynamicInvestors, isLoading } = useInvestors();
  const { meetings } = useMeetings();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | number | null>(null);

  // Unique Stages / Interests
  const allStages = useMemo(
    () => Array.from(new Set(dynamicInvestors.flatMap(i => i.investmentStage || []))),
    [dynamicInvestors]
  );

  const allInterests = useMemo(
    () => Array.from(new Set(dynamicInvestors.flatMap(i => i.investmentInterests || []))),
    [dynamicInvestors]
  );

  // Filter Investors
  const filteredInvestors = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return dynamicInvestors.filter(inv => {
      const nameMatch = inv.name?.toLowerCase().includes(q);
      const bioMatch = inv.bio?.toLowerCase().includes(q);
      const interestMatch = inv.investmentInterests?.some(i => i.toLowerCase().includes(q));

      const matchesSearch = !q || nameMatch || bioMatch || interestMatch;

      const matchesStages =
        selectedStages.length === 0 ||
        inv.investmentStage?.some(stage => selectedStages.includes(stage));

      const matchesInterests =
        selectedInterests.length === 0 ||
        inv.investmentInterests?.some(interest => selectedInterests.includes(interest));

      return matchesSearch && matchesStages && matchesInterests;
    });
  }, [dynamicInvestors, searchQuery, selectedStages, selectedInterests]);

  // Toggle helper
  const toggleFilter = (
    item: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]));
  };

  // Meeting modal
  const handleScheduleMeeting = (id: string | number) => {
    setSelectedUserId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Find Investors</h1>
        <p className="text-gray-600">Connect with investors who match your startup's needs</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            </CardHeader>

            <CardBody className="space-y-6">
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 animate-pulse">
                  <Loader2 size={12} className="animate-spin" /> Fetching data...
                </div>
              )}

              {/* Stages */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Investment Stage</h3>
                <div className="space-y-2">
                  {allStages.map(stage => (
                    <button
                      key={stage}
                      onClick={() => toggleFilter(stage, setSelectedStages)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                        selectedStages.includes(stage)
                          ? 'bg-primary-50 text-primary-700 font-bold border-l-4 border-primary-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {allInterests.map(interest => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? 'primary' : 'gray'}
                      className="cursor-pointer"
                      onClick={() => toggleFilter(interest, setSelectedInterests)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3 space-y-6">
          {/* Search + Count */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search investors..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                startAdornment={<Search size={18} className="text-gray-400" />}
                fullWidth
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
              <Filter size={18} />
              <span>{filteredInvestors.length} Results</span>
            </div>
          </div>

          {/* Investor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredInvestors.map(inv => {
              const hasConfirmedMeeting = meetings.some(
                m =>
                  (m.receiver_id === inv.id || m.sender_id === inv.id) &&
                  m.status === 'accepted'
              );

              return (
                <div key={inv.id} className="flex flex-col gap-2">
                  <InvestorCard investor={inv} />

                  {hasConfirmedMeeting ? (
                    <Button
                      fullWidth
                      variant="success"
                      size="sm"
                      className="flex items-center justify-center gap-2 shadow-sm"
                      onClick={() => (window.location.href = '/messages')}
                    >
                      <Loader2 size={14} className="text-white" /> Meeting Confirmed
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="primary"
                      size="sm"
                      className="flex items-center justify-center gap-2 shadow-sm"
                      onClick={() => handleScheduleMeeting(inv.id)}
                    >
                      <Calendar size={14} /> Schedule Meeting
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {!isLoading && filteredInvestors.length === 0 && (
            <div className="text-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed">
              <p className="text-gray-500">No matching investors found</p>
            </div>
          )}
        </main>
      </div>

      {/* Schedule Meeting Modal */}
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
