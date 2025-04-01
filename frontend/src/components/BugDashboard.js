import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getBugs, triggerEmailCheck } from '../api/bugService';
import BugCard from './BugCard';
import BugFilters from './BugFilters';
import './BugDashboard.css'; 

function BugDashboard() {
    const [allBugs, setAllBugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCheckingEmails, setIsCheckingEmails] = useState(false); 
    const [refreshMessage, setRefreshMessage] = useState(''); 

    const [filters, setFilters] = useState({
        searchTerm: '',
        status: '', 
        priority: '',
        assignee: '',
    });

    const fetchBugs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getBugs();
            setAllBugs(response.data || []); 
        } catch (err) {
            console.error("Failed to fetch bugs:", err);
            setError("Failed to load bugs. Ensure the backend is running and reachable.");
            setAllBugs([]);
        } finally {
            setLoading(false);
        }
    }, []); 

    useEffect(() => {
        fetchBugs();
    }, [fetchBugs]);

    const handleFilterChange = useCallback((name, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value,
        }));
    }, []);

    const filteredBugs = useMemo(() => {
        return allBugs.filter(bug => {
            const searchTermLower = filters.searchTerm.toLowerCase();
            const statusMatch = !filters.status || bug.status === filters.status;
            const priorityMatch = !filters.priority || bug.priority === filters.priority;
            const assigneeMatch = !filters.assignee || (bug.assignee && bug.assignee.toLowerCase().includes(filters.assignee.toLowerCase()));
            const textMatch = !filters.searchTerm ||
                              bug.unique_id.toLowerCase().includes(searchTermLower) ||
                              (bug.latest_subject && bug.latest_subject.toLowerCase().includes(searchTermLower));

            return statusMatch && priorityMatch && assigneeMatch && textMatch;
        });
    }, [allBugs, filters]);

    const handleRefreshClick = async () => {
        setIsCheckingEmails(true);
        setError(null); 
        setRefreshMessage('Initiating email check...'); 

        try {
            const triggerResponse = await triggerEmailCheck();
            setRefreshMessage(triggerResponse.data.message || 'Email check started...'); 

            const waitTime = 5000; 
            setRefreshMessage(`Waiting ${waitTime / 1000}s for processing...`);

            await new Promise(resolve => setTimeout(resolve, waitTime));

            setRefreshMessage('Fetching updated bug list...');
            await fetchBugs(); 
            setRefreshMessage('Update complete.'); 

            setTimeout(() => setRefreshMessage(''), 3000);

        } catch (err) {
            console.error("Failed during refresh process:", err);
            const errorMsg = `Refresh Error: ${err.response?.data?.error || err.message}`;
            setError(errorMsg); 
            setRefreshMessage(''); 
        } finally {
            setIsCheckingEmails(false);
        }
    };

    const handleBugUpdate = () => {
        setRefreshMessage('Refreshing list after update...');
        fetchBugs().finally(() => {
            setTimeout(() => setRefreshMessage(''), 1500); 
        });
   };

  return (
      <div className="bug-dashboard">
          <div className="dashboard-header">
              <h1>Bug Dashboard</h1>
              <div className="refresh-controls">
                 {refreshMessage && <span className="refresh-message">{refreshMessage}</span>}
                  <button
                      onClick={handleRefreshClick}
                      disabled={isCheckingEmails || loading}
                      className="refresh-button"
                  >
                      {isCheckingEmails ? 'Checking...' : 'Check for New Emails'}
                  </button>
              </div>
          </div>

          <BugFilters filters={filters} onFilterChange={handleFilterChange} />

          {error && <p className="error-message">{error}</p>}

          <div className="bug-list">
              {loading && !isCheckingEmails && <p>Loading initial bugs...</p>}
              {!loading && filteredBugs.length === 0 && <p>No bugs match the current filters.</p>}
              {!loading && filteredBugs.map(bug => (
                  <BugCard key={bug.unique_id} bug={bug} onUpdate={handleBugUpdate} />
              ))}
          </div>
      </div>
  );
}

export default BugDashboard;