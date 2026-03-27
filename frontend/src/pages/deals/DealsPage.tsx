import React, { useState, useMemo } from 'react';
import { Search, Filter, DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';

// UI Components
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

// Define the interface for a Deal to ensure type safety
interface Deal {
  id: number;
  startup: {
    name: string;
    logo: string;
    industry: string;
  };
  amount: string;
  equity: string;
  status: 'Due Diligence' | 'Term Sheet' | 'Negotiation' | 'Closed' | 'Passed';
  stage: string;
  lastActivity: string;
}

const deals: Deal[] = [
  {
    id: 1,
    startup: { name: 'TechWave AI', logo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg', industry: 'FinTech' },
    amount: '$1.5M', equity: '15%', status: 'Due Diligence', stage: 'Series A', lastActivity: '2024-02-15'
  },
  {
    id: 2,
    startup: { name: 'GreenLife Solutions', logo: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg', industry: 'CleanTech' },
    amount: '$2M', equity: '20%', status: 'Term Sheet', stage: 'Seed', lastActivity: '2024-02-10'
  },
  {
    id: 3,
    startup: { name: 'HealthPulse', logo: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg', industry: 'HealthTech' },
    amount: '$800K', equity: '12%', status: 'Negotiation', stage: 'Pre-seed', lastActivity: '2024-02-05'
  }
];

export const DealsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  
  const statusOptions = ['Due Diligence', 'Term Sheet', 'Negotiation', 'Closed', 'Passed'];

  // FIX: Added filtering logic using useMemo for performance
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = deal.startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            deal.startup.industry.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(deal.status);
      
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, selectedStatuses]);

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const getStatusColor = (status: string): "primary" | "secondary" | "accent" | "success" | "error" | "gray" => {
    switch (status) {
      case 'Due Diligence': return 'primary';
      case 'Term Sheet': return 'secondary';
      case 'Negotiation': return 'accent';
      case 'Closed': return 'success';
      case 'Passed': return 'error';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Deals</h1>
          <p className="text-gray-600">Track and manage your investment pipeline</p>
        </div>
        <Button>Add Deal</Button>
      </div>
      
      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<DollarSign size={20} />} label="Total Investment" value="$4.3M" color="primary" />
        <MetricCard icon={<TrendingUp size={20} />} label="Active Deals" value="8" color="secondary" />
        <MetricCard icon={<Users size={20} />} label="Portfolio Companies" value="12" color="accent" />
        <MetricCard icon={<Calendar size={20} />} label="Closed This Month" value="2" color="success" />
      </div>
      
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="w-full lg:w-1/2">
            <Input
              placeholder="Search by startup name or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} className="text-gray-400" />}
              fullWidth
            />
          </div>
          
          <div className="w-full lg:w-1/2 flex items-center gap-3">
            <Filter size={18} className="text-gray-500 shrink-0" />
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(status => (
                <Badge
                  key={status}
                  variant={selectedStatuses.includes(status) ? getStatusColor(status) : 'gray'}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => toggleStatus(status)}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Deals Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b">
          <h2 className="text-lg font-medium text-gray-900">Pipeline Tracking</h2>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-4">Startup</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Equity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDeals.length > 0 ? (
                  filteredDeals.map(deal => (
                    <tr key={deal.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Avatar src={deal.startup.logo} alt={deal.startup.name} size="sm" />
                          <div className="ml-3">
                            <div className="text-sm font-bold text-gray-900">{deal.startup.name}</div>
                            <div className="text-xs text-gray-500">{deal.startup.industry}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{deal.amount}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{deal.equity}</td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusColor(deal.status)}>{deal.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{deal.stage}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(deal.lastActivity).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm">Details</Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      No deals found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

// Reusable Metric Card Sub-component
const MetricCard = ({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
  <Card>
    <CardBody className="flex items-center p-4">
      <div className={`p-3 bg-${color}-100 rounded-lg mr-4 text-${color}-600`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </CardBody>
  </Card>
);