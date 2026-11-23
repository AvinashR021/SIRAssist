import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  Database,
  Search,
  RotateCcw,
  Filter,
  Play,
  Layers,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldCheck,
  Code,
  ArrowUpDown,
  FileText
} from 'lucide-react';

export default function DbmsDemoPage() {
  const { user } = useContext(AuthContext);

  // Tab State: 'explorer' (Primary) | 'demo_queries' (Academic Viva) | 'schema'
  const [activeTab, setActiveTab] = useState('explorer');

  // Master Metadata from Backend
  const [queryCategories, setQueryCategories] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [pollingStations, setPollingStations] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    verificationStatuses: [],
    requestTypes: [],
    reviewStatuses: [],
    documentTypes: [],
    volunteers: []
  });

  // Active Filter Selection States
  const [selectedCategory, setSelectedCategory] = useState('search_constituencies');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedConstituencyId, setSelectedConstituencyId] = useState('');
  const [selectedPollingStationId, setSelectedPollingStationId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRequestType, setSelectedRequestType] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortOrder, setSortOrder] = useState('ASC');

  // Results State
  const [resultsData, setResultsData] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Phase 11: Academic Concept Demo States
  const [demoConcepts, setDemoConcepts] = useState([]);
  const [selectedConceptId, setSelectedConceptId] = useState('concept_select');
  const [conceptResult, setConceptResult] = useState(null);
  const [executingConcept, setExecutingConcept] = useState(false);

  // ─── Initial Data Loading ──────────────────────────────────────────────────
  useEffect(() => {
    // 1. Fetch available query categories (role-filtered)
    API.get('/explorer/query-types')
      .then(res => {
        setQueryCategories(res.data.categories || []);
      })
      .catch(console.error);

    // 2. Fetch states
    API.get('/explorer/states')
      .then(res => setStates(res.data || []))
      .catch(console.error);

    // 3. Fetch master filter options
    API.get('/explorer/filter-options')
      .then(res => setFilterOptions(res.data || {}))
      .catch(console.error);

    // 4. Fetch demo concepts for viva evaluation
    API.get('/explorer/demo-concepts')
      .then(res => {
        setDemoConcepts(res.data || []);
        if (res.data && res.data.length > 0) {
          executeConcept(res.data[0].id);
        }
      })
      .catch(console.error);
  }, [user]);

  // Execute initial search once categories are loaded
  useEffect(() => {
    executeSearch(1);
  }, [selectedCategory]);

  // ─── Cascading Dropdown Handlers ───────────────────────────────────────────
  // State change -> load districts
  const handleStateChange = async (newState) => {
    setSelectedState(newState);
    setSelectedDistrict('');
    setSelectedConstituencyId('');
    setSelectedPollingStationId('');
    setConstituencies([]);
    setPollingStations([]);

    if (newState) {
      try {
        const res = await API.get(`/explorer/districts?state=${encodeURIComponent(newState)}`);
        setDistricts(res.data || []);
      } catch (err) {
        console.error(err);
      }
    } else {
      setDistricts([]);
    }
  };

  // District change -> load constituencies
  const handleDistrictChange = async (newDistrict) => {
    setSelectedDistrict(newDistrict);
    setSelectedConstituencyId('');
    setSelectedPollingStationId('');
    setPollingStations([]);

    if (newDistrict) {
      try {
        const res = await API.get(`/explorer/constituencies?district=${encodeURIComponent(newDistrict)}`);
        setConstituencies(res.data || []);
      } catch (err) {
        console.error(err);
      }
    } else {
      setConstituencies([]);
    }
  };

  // Constituency change -> load polling stations
  const handleConstituencyChange = async (newConstId) => {
    setSelectedConstituencyId(newConstId);
    setSelectedPollingStationId('');

    if (newConstId) {
      try {
        const res = await API.get(`/explorer/polling-stations?constituencyId=${encodeURIComponent(newConstId)}`);
        setPollingStations(res.data || []);
      } catch (err) {
        console.error(err);
      }
    } else {
      setPollingStations([]);
    }
  };

  // ─── Search Execution ──────────────────────────────────────────────────────
  const executeSearch = async (targetPage = currentPage) => {
    setLoadingResults(true);
    setSearchError('');

    try {
      const params = {
        category: selectedCategory,
        page: targetPage,
        limit: pageSize,
        sortOrder: sortOrder
      };

      if (selectedState) params.state = selectedState;
      if (selectedDistrict) params.district = selectedDistrict;
      if (selectedConstituencyId) params.constituencyId = selectedConstituencyId;
      if (selectedPollingStationId) params.pollingStationId = selectedPollingStationId;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedRequestType) params.requestType = selectedRequestType;
      if (selectedDocType) params.docType = selectedDocType;
      if (selectedReviewStatus) params.reviewStatus = selectedReviewStatus;
      if (selectedVolunteerId) params.volunteerId = selectedVolunteerId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchKeyword.trim()) params.search = searchKeyword.trim();

      const res = await API.get('/explorer/search', { params });
      setResultsData(res.data);
      setCurrentPage(res.data.currentPage || 1);
    } catch (err) {
      setSearchError(err.response?.data?.error || 'Failed to retrieve database records.');
      setResultsData(null);
    } finally {
      setLoadingResults(false);
    }
  };

  // Reset all filters to default state
  const handleResetFilters = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedConstituencyId('');
    setSelectedPollingStationId('');
    setSelectedStatus('');
    setSelectedRequestType('');
    setSelectedDocType('');
    setSelectedReviewStatus('');
    setSelectedVolunteerId('');
    setStartDate('');
    setEndDate('');
    setSearchKeyword('');
    setCurrentPage(1);
    setSortOrder('ASC');
    setDistricts([]);
    setConstituencies([]);
    setPollingStations([]);

    // Execute with defaults
    setTimeout(() => {
      executeSearch(1);
    }, 50);
  };

  // ─── Phase 11: Execute Demo Concept (Faculty Evaluation) ───────────────────
  const executeConcept = async (conceptId) => {
    setExecutingConcept(true);
    setSelectedConceptId(conceptId);
    try {
      const res = await API.post('/explorer/execute-concept', { conceptId });
      setConceptResult(res.data);
    } catch (err) {
      console.error('Failed to execute concept:', err);
    } finally {
      setExecutingConcept(false);
    }
  };

  const currentCategoryConfig = queryCategories.find(c => c.id === selectedCategory);
  const activeConcept = demoConcepts.find(c => c.id === selectedConceptId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-0.5 rounded-full text-indigo-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Relational Database Management System (MySQL 8.0)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              SIRAssist – Database Explorer
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Explore constituency, polling station, verification, and assistance records using interactive filters. All queries execute securely on the backend.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'explorer'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Database className="w-4 h-4" /> Interactive Explorer
            </button>
            <button
              onClick={() => setActiveTab('demo_queries')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'demo_queries'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Code className="w-4 h-4" /> DBMS Concepts Demo
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'schema'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" /> Relational Schema & 3NF
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: INTERACTIVE DATABASE EXPLORER (PRIMARY) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'explorer' && (
        <div className="space-y-6">
          {/* Query Category & Filters Card */}
          <div className="card shadow-sm border-slate-200 p-5 space-y-5">
            {/* 1. Category Selection Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
              <div className="md:col-span-2">
                <label className="form-label font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  Select Query Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-select font-semibold text-sm text-indigo-950 bg-indigo-50/40 border-indigo-200 focus:border-indigo-500"
                >
                  {queryCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} — {cat.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex flex-col justify-center">
                <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block">DBMS Concept Executed:</span>
                <span className="font-mono text-indigo-700 font-bold mt-0.5">
                  {currentCategoryConfig?.sqlConcept || 'SELECT, WHERE, JOIN'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Parameterized query executed server-side.
                </span>
              </div>
            </div>

            {/* 2. Dynamic Cascading Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* State Filter */}
              <div>
                <label className="form-label font-semibold">State</label>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="form-select text-xs"
                >
                  <option value="">All States</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* District Filter (Cascades from State) */}
              <div>
                <label className="form-label font-semibold">District</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="form-select text-xs"
                  disabled={districts.length === 0 && !selectedState}
                >
                  <option value="">All Districts</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Constituency Filter (Cascades from District) */}
              <div>
                <label className="form-label font-semibold">Constituency</label>
                <select
                  value={selectedConstituencyId}
                  onChange={(e) => handleConstituencyChange(e.target.value)}
                  className="form-select text-xs"
                  disabled={constituencies.length === 0}
                >
                  <option value="">
                    {constituencies.length === 0 ? 'Select district first' : 'All Constituencies'}
                  </option>
                  {constituencies.map(c => (
                    <option key={c.constituency_id} value={c.constituency_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Polling Station Filter (Cascades from Constituency) */}
              <div>
                <label className="form-label font-semibold">Polling Station</label>
                <select
                  value={selectedPollingStationId}
                  onChange={(e) => setSelectedPollingStationId(e.target.value)}
                  className="form-select text-xs"
                  disabled={pollingStations.length === 0}
                >
                  <option value="">
                    {pollingStations.length === 0 ? 'Select constituency first' : 'All Polling Stations'}
                  </option>
                  {pollingStations.map(ps => (
                    <option key={ps.polling_station_id} value={ps.polling_station_id}>
                      {ps.station_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verification Status (Conditional) */}
              {['verification_requests', 'pending_requests'].includes(selectedCategory) && (
                <div>
                  <label className="form-label font-semibold">Verification Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="form-select text-xs font-semibold"
                  >
                    <option value="">All Statuses</option>
                    {filterOptions.verificationStatuses.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Request Type (Conditional) */}
              {['verification_requests', 'pending_requests'].includes(selectedCategory) && (
                <div>
                  <label className="form-label font-semibold">Request Type</label>
                  <select
                    value={selectedRequestType}
                    onChange={(e) => setSelectedRequestType(e.target.value)}
                    className="form-select text-xs"
                  >
                    <option value="">All Request Types</option>
                    {filterOptions.requestTypes.map(rt => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Volunteer Filter (Conditional) */}
              {['volunteer_assistance', 'document_reviews', 'volunteer_assignment_summary'].includes(selectedCategory) && (
                <div>
                  <label className="form-label font-semibold">Assigned Volunteer</label>
                  <select
                    value={selectedVolunteerId}
                    onChange={(e) => setSelectedVolunteerId(e.target.value)}
                    className="form-select text-xs"
                  >
                    <option value="">All Volunteers</option>
                    {filterOptions.volunteers.map(v => (
                      <option key={v.volunteer_id} value={v.volunteer_id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Document Review Status (Conditional) */}
              {selectedCategory === 'document_reviews' && (
                <div>
                  <label className="form-label font-semibold">Review Status</label>
                  <select
                    value={selectedReviewStatus}
                    onChange={(e) => setSelectedReviewStatus(e.target.value)}
                    className="form-select text-xs"
                  >
                    <option value="">All Review Statuses</option>
                    {filterOptions.reviewStatuses.map(rs => (
                      <option key={rs} value={rs}>{rs}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Filters (Conditional) */}
              {['verification_requests', 'volunteer_assistance'].includes(selectedCategory) && (
                <>
                  <div>
                    <label className="form-label font-semibold">From Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="form-label font-semibold">To Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>
                </>
              )}

              {/* Keyword Search */}
              <div className="md:col-span-2">
                <label className="form-label font-semibold">Keyword Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeSearch(1)}
                    placeholder="Search by name, reference code, village, or keyword..."
                    className="form-input text-xs pl-8"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="form-label font-semibold flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /> Sort Direction
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="form-select text-xs font-mono"
                >
                  <option value="ASC">ASC (Ascending / A-Z)</option>
                  <option value="DESC">DESC (Descending / Z-A)</option>
                </select>
              </div>
            </div>

            {/* 3. Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-medium">
                {currentCategoryConfig?.description}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-outline btn-sm text-xs py-1.5 px-3 flex items-center gap-1 text-slate-600 hover:bg-slate-100"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
                </button>
                <button
                  type="button"
                  onClick={() => executeSearch(1)}
                  disabled={loadingResults}
                  className="btn btn-primary btn-sm text-xs py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 border-none flex items-center gap-1.5 shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  {loadingResults ? 'Querying MySQL...' : 'Search Records'}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {searchError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Results Display */}
          <div className="card shadow-sm border-slate-200 overflow-hidden">
            {/* Result Header & Metrics */}
            <div className="card-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="card-title text-base flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  {resultsData?.categoryName || 'Query Results'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Displaying records matched by parameterized query logic in MySQL.
                </p>
              </div>

              {resultsData && (
                <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
                  <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                    Matches: <strong className="text-indigo-700">{resultsData.totalRecords}</strong>
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>{resultsData.executionTimeMs} ms</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Table Container */}
            <div className="table-container min-h-[220px]">
              {loadingResults ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="font-semibold text-slate-600 text-xs">Executing query in MySQL backend...</p>
                </div>
              ) : !resultsData || resultsData.records.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">No records found matching your filters.</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Try broadening your search or resetting state/district selections to explore available records.
                  </p>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      {Object.keys(resultsData.records[0]).map(col => (
                        <th key={col} className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultsData.records.map((row, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/20 transition">
                        {Object.entries(row).map(([key, val], vIdx) => {
                          // Render formatted values based on column type
                          const isId = key.endsWith('_id') || key.endsWith('_code');
                          const isStatus = key.includes('status') || key.includes('decision');
                          const isDate = key.includes('date') || key.includes('at');

                          return (
                            <td key={vIdx} className="text-xs">
                              {val === null || val === undefined ? (
                                <span className="text-slate-400 italic">None</span>
                              ) : isId ? (
                                <span className="font-mono text-xs font-bold text-slate-600">
                                  {String(val)}
                                </span>
                              ) : isStatus ? (
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  val === 'Reviewed – No Issues Found' || val === 'Verified' || val === 'RESOLVED' || val === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : val === 'Correction Required' || val === 'REJECTED' || val === 'Rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : val === 'Pending Review' || val === 'SUBMITTED' || val === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}>
                                  {String(val)}
                                </span>
                              ) : isDate ? (
                                <span className="text-slate-500">
                                  {new Date(val).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-slate-800">{String(val)}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Server-Side Pagination Bar */}
            {resultsData && resultsData.totalPages > 1 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value));
                      executeSearch(1);
                    }}
                    className="form-select text-xs py-1 px-2 w-16"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 font-medium text-slate-600">
                  <span>Page {resultsData.currentPage} of {resultsData.totalPages}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => executeSearch(currentPage - 1)}
                      disabled={currentPage <= 1 || loadingResults}
                      className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => executeSearch(currentPage + 1)}
                      disabled={currentPage >= resultsData.totalPages || loadingResults}
                      className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: DBMS QUERY DEMONSTRATION (PHASE 11 FOR EVALUATION) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'demo_queries' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm font-bold text-amber-950 mb-0.5">Faculty Evaluation Demonstration Panel</strong>
              This section presents 10 classic DBMS concepts (SELECT, WHERE, INNER JOIN, LEFT JOIN, GROUP BY, Aggregate functions, Subqueries, and multi-table joins).
              Each query executes a predefined backend statement against the active MySQL database without frontend SQL code injection.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Concept List */}
            <div className="card space-y-2 md:col-span-1 p-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 px-2 py-1">
                Demonstration Concepts
              </h3>
              <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
                {demoConcepts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => executeConcept(c.id)}
                    className={`w-full text-left p-3 rounded-lg text-xs transition border ${
                      c.id === selectedConceptId
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                      {c.concept}
                    </span>
                    <span className="mt-0.5 block">{c.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Concept Details & Live Results */}
            <div className="card md:col-span-2 space-y-4 p-5">
              {activeConcept && (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <div>
                      <span className="inline-block bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                        {activeConcept.concept}
                      </span>
                      <h2 className="text-lg font-bold text-slate-800">{activeConcept.title}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{activeConcept.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => executeConcept(activeConcept.id)}
                      disabled={executingConcept}
                      className="btn btn-primary btn-sm bg-indigo-600 hover:bg-indigo-700 border-none flex items-center gap-1.5 text-xs py-1.5 px-3 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {executingConcept ? 'Executing...' : 'Re-Execute in MySQL'}
                    </button>
                  </div>

                  {/* Read-Only Formatted SQL Box */}
                  <div className="bg-slate-900 text-indigo-300 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 relative">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] border-b border-slate-800 pb-1.5 mb-2">
                      <span className="flex items-center gap-1 font-semibold text-slate-300">
                        <Code className="w-3.5 h-3.5 text-indigo-400" /> Backend Parameterized SQL Statement (Read-Only)
                      </span>
                      <span>Target: MySQL 8.0</span>
                    </div>
                    <code>{conceptResult?.sql || activeConcept.sql}</code>
                  </div>
                </div>
              )}

              {/* Execution Metrics & Table */}
              {conceptResult && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span>Returned Rows: <strong className="text-slate-800">{conceptResult.rowCount}</strong></span>
                    <span>Server Query Duration: <strong className="text-emerald-700">{conceptResult.executionTimeMs} ms</strong></span>
                  </div>

                  <div className="table-container max-h-[320px] overflow-y-auto">
                    {conceptResult.results && conceptResult.results.length > 0 ? (
                      <table className="table">
                        <thead>
                          <tr>
                            {conceptResult.columns.map(col => (
                              <th key={col} className="font-mono text-[11px] text-slate-700">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {conceptResult.results.map((row, idx) => (
                            <tr key={idx}>
                              {Object.values(row).map((val, vIdx) => (
                                <td key={vIdx} className="font-mono text-xs">
                                  {val === null ? (
                                    <span className="text-slate-400 italic">NULL</span>
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-center py-8 text-xs text-slate-400 font-mono">
                        Query executed successfully (0 matching rows returned).
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: RELATIONAL SCHEMA & 3NF NORMALIZATION */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          <div className="card space-y-5 p-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" />
              Relational Schema Architecture & 3NF Normalization
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              SIRAssist is designed according to Third Normal Form (3NF) relational principles to eliminate data redundancy, prevent insertion, update, and deletion anomalies, and guarantee referential integrity.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <strong className="text-blue-700 font-bold block mb-1">1NF (First Normal Form)</strong>
                <p className="text-slate-600">
                  Every attribute contains strictly atomic, indivisible values. Repeating groups such as multi-document uploads are decomposed into separate child entities (<code>Document_Version</code>, <code>Request_Document</code>).
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <strong className="text-indigo-700 font-bold block mb-1">2NF (Second Normal Form)</strong>
                <p className="text-slate-600">
                  In 1NF, and all non-key attributes are fully functionally dependent on the entire primary key, eliminating partial functional dependencies in junction tables like <code>Volunteer_Assignment</code>.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <strong className="text-purple-700 font-bold block mb-1">3NF (Third Normal Form)</strong>
                <p className="text-slate-600">
                  In 2NF, and no non-key attribute is transitively dependent on the primary key. Address and geographic area details are decoupled into <code>Address</code> and <code>Area</code> tables.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Relational Entity Definitions & Foreign Key Constraints
              </h3>
              <div className="p-4 bg-slate-900 text-indigo-200 rounded-xl font-mono text-xs leading-relaxed space-y-1.5 overflow-x-auto border border-slate-800">
                <div>• <strong>Constituency</strong> (<u>constituency_id</u>, name, district, state)</div>
                <div>• <strong>Polling_Station</strong> (<u>polling_station_id</u>, station_name, address_id<sup>FK</sup>, constituency_id<sup>FK</sup>)</div>
                <div>• <strong>Address</strong> (<u>address_id</u>, house_number, street, village, taluk, district, state, pin_code)</div>
                <div>• <strong>Area</strong> (<u>area_id</u>, name, taluk, district, state, pin_code)</div>
                <div>• <strong>Citizen</strong> (<u>citizen_id</u>, name, date_of_birth, gender, mobile, email, address_id<sup>FK</sup>)</div>
                <div>• <strong>Voter_Record</strong> (<u>voter_id</u>, citizen_id<sup>FK</sup>, epic_reference, constituency_id<sup>FK</sup>, polling_station_id<sup>FK</sup>, record_status)</div>
                <div>• <strong>Verification_Request</strong> (<u>request_id</u>, citizen_id<sup>FK</sup>, voter_id<sup>FK</sup>, request_type, current_status, submission_date)</div>
                <div>• <strong>Document</strong> (<u>document_id</u>, citizen_id<sup>FK</sup>, request_id<sup>FK</sup>, document_type, current_version, file_review_status)</div>
                <div>• <strong>Document_Version</strong> (<u>version_id</u>, document_id<sup>FK</sup>, version_number, storage_key, mime_type, file_size_bytes)</div>
                <div>• <strong>Document_Review</strong> (<u>review_id</u>, version_id<sup>FK, UNIQUE</sup>, volunteer_id<sup>FK</sup>, review_decision, issue_category, feedback_message)</div>
                <div>• <strong>Volunteer</strong> (<u>volunteer_id</u>, name, mobile, email, area_id<sup>FK</sup>, availability, skills)</div>
                <div>• <strong>Volunteer_Assignment</strong> (<u>assignment_id</u>, document_id<sup>FK</sup>, volunteer_id<sup>FK</sup>, assigned_by<sup>FK</sup>, status)</div>
                <div>• <strong>Assistance_Request</strong> (<u>assistance_id</u>, citizen_id<sup>FK</sup>, volunteer_id<sup>FK</sup>, request_type, status, priority)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
