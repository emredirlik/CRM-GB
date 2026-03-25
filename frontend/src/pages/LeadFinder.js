import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Search, 
  Loader2, 
  Globe, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  ExternalLink,
  Plus,
  CheckCircle,
  Sparkles,
  History
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeadFinder = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [keywords, setKeywords] = useState(['gyros producer', 'döner manufacturer']);
  const [newKeyword, setNewKeyword] = useState('');
  const [location, setLocation] = useState('Athens');
  const [country, setCountry] = useState('Greece');
  const [limit, setLimit] = useState(20);
  const [results, setResults] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [searchHistory, setSearchHistory] = useState([]);
  const [templates, setTemplates] = useState({});

  useEffect(() => {
    fetchTemplates();
    fetchSearchHistory();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/leads/search/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchSearchHistory = async () => {
    try {
      const response = await axios.get(`${API}/leads/search/history`);
      setSearchHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch search history:', error);
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleSearch = async () => {
    if (keywords.length === 0) {
      toast.error('Error', { description: 'Please add at least one search keyword' });
      return;
    }

    setLoading(true);
    setResults([]);
    setSelectedLeads(new Set());

    try {
      const response = await axios.post(`${API}/leads/search`, {
        keywords,
        location,
        country,
        limit
      }, { timeout: 120000 }); // 2 minute timeout

      setResults(response.data.leads || []);
      toast.success('Arama Tamamlandı', { 
        description: `${response.data.total_found} potansiyel müşteri bulundu` 
      });
      fetchSearchHistory();
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Arama Başarısız', { 
        description: error.response?.data?.detail || error.message || 'Arama sırasında bir hata oluştu' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLead = (index) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === results.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(results.map((_, i) => i)));
    }
  };

  const handleImportSelected = async () => {
    if (selectedLeads.size === 0) {
      toast.error('Error', { description: 'Please select leads to import' });
      return;
    }

    setImporting(true);
    try {
      const leadsToImport = Array.from(selectedLeads).map(i => results[i]);
      const response = await axios.post(`${API}/leads/import`, leadsToImport);

      toast.success('Import Complete', { 
        description: `Imported ${response.data.imported_count} leads, skipped ${response.data.skipped_count} duplicates` 
      });
      
      // Clear selected after import
      setSelectedLeads(new Set());
    } catch (error) {
      toast.error('Import Failed', { 
        description: error.response?.data?.detail || 'Failed to import leads' 
      });
    } finally {
      setImporting(false);
    }
  };

  const applyTemplate = (templateKey) => {
    const template = templates[templateKey];
    if (template) {
      setKeywords(template.keywords);
      setCountry(template.country);
      toast.success('Template Applied', { description: `Using ${templateKey} search template` });
    }
  };

  return (
    <div className="space-y-6" data-testid="lead-finder-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">Lead Finder</h1>
        <p className="text-muted-foreground mt-1">Automatically discover potential B2B customers using AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Configuration */}
        <div className="space-y-6">
          {/* Quick Templates */}
          <Card data-testid="templates-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-['Manrope'] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Quick Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.keys(templates).map((key) => (
                <Button 
                  key={key}
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => applyTemplate(key)}
                  data-testid={`template-${key}`}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Search Parameters */}
          <Card data-testid="search-params-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-['Manrope'] flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Keywords */}
              <div className="space-y-2">
                <Label>Search Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="e.g., kebab factory"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                    data-testid="keyword-input"
                  />
                  <Button size="sm" onClick={handleAddKeyword} data-testid="add-keyword-btn">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywords.map((keyword, i) => (
                    <Badge 
                      key={i} 
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveKeyword(keyword)}
                    >
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>Location / City</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Athens, Thessaloniki"
                  data-testid="location-input"
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger data-testid="country-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Greece">Greece</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="Turkey">Turkey</SelectItem>
                    <SelectItem value="Netherlands">Netherlands</SelectItem>
                    <SelectItem value="Belgium">Belgium</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Austria">Austria</SelectItem>
                    <SelectItem value="Switzerland">Switzerland</SelectItem>
                    <SelectItem value="Europe">All Europe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Limit */}
              <div className="space-y-2">
                <Label>Max Results: {limit}</Label>
                <Input
                  type="range"
                  min="5"
                  max="50"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="cursor-pointer"
                  data-testid="limit-slider"
                />
              </div>

              {/* Search Button */}
              <Button 
                onClick={handleSearch} 
                disabled={loading || keywords.length === 0}
                className="w-full"
                data-testid="search-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching with AI...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find Leads
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <Card data-testid="search-history-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-['Manrope'] flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchHistory.slice(0, 5).map((search, i) => (
                    <div 
                      key={i} 
                      className="text-sm p-2 bg-muted/50 rounded-md cursor-pointer hover:bg-muted"
                      onClick={() => {
                        setKeywords(search.query_keywords);
                        setLocation(search.location);
                        setCountry(search.country);
                      }}
                    >
                      <p className="font-medium">{search.location}, {search.country}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {search.query_keywords.join(', ')}
                      </p>
                      <p className="text-xs text-primary mt-1">
                        {search.leads_found?.length || 0} leads found
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          <Card className="h-full" data-testid="results-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-['Manrope'] flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Found Leads ({results.length})
                </CardTitle>
                {results.length > 0 && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSelectAll}
                      data-testid="select-all-btn"
                    >
                      {selectedLeads.size === results.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleImportSelected}
                      disabled={selectedLeads.size === 0 || importing}
                      data-testid="import-btn"
                    >
                      {importing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Import ({selectedLeads.size})
                    </Button>
                  </div>
                )}
              </div>
              <CardDescription>
                {results.length === 0 
                  ? 'Configure search parameters and click "Find Leads" to discover potential customers'
                  : 'Select leads to import them into your database'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
                  <p className="font-medium">Searching for leads...</p>
                  <p className="text-sm">AI is analyzing business data</p>
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Globe className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-medium">No leads found yet</p>
                  <p className="text-sm">Start a search to find potential customers</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {results.map((lead, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        selectedLeads.has(index) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleSelectLead(index)}
                      data-testid={`lead-card-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={selectedLeads.has(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{lead.company_name}</h3>
                            {selectedLeads.has(index) && (
                              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                          
                          {lead.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {lead.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                            {lead.email && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {lead.email}
                              </span>
                            )}
                            {lead.phone && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </span>
                            )}
                            {(lead.city || lead.country) && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {[lead.city, lead.country].filter(Boolean).join(', ')}
                              </span>
                            )}
                            {lead.website && (
                              <a 
                                href={lead.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" />
                                Website
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadFinder;
