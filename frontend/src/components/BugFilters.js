import React from 'react';

const STATUS_CHOICES = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITY_CHOICES = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function BugFilters({ filters, onFilterChange }) {

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        onFilterChange(name, value);
    };

    const handleSelectChange = (event) => {
         const { name, value } = event.target;
         onFilterChange(name, value === 'ALL' ? '' : value); 
    };

    return (
        <div className="bug-filters">
            <input
                type="text"
                name="searchTerm"
                placeholder="Search subject or ID..."
                value={filters.searchTerm}
                onChange={handleInputChange}
                className="filter-input"
            />
            <select
                name="status"
                value={filters.status || 'ALL'} 
                onChange={handleSelectChange}
                className="filter-select"
            >
                {STATUS_CHOICES.map(status => (
                    <option key={status} value={status}>{status === 'ALL' ? 'All Statuses' : status}</option>
                ))}
            </select>
             <select
                name="priority"
                value={filters.priority || 'ALL'} 
                onChange={handleSelectChange}
                className="filter-select"
            >
                {PRIORITY_CHOICES.map(p => (
                    <option key={p} value={p}>{p === 'ALL' ? 'All Priorities' : p}</option>
                ))}
            </select>
             <input
                type="text"
                name="assignee"
                placeholder="Filter by assignee..."
                value={filters.assignee}
                onChange={handleInputChange}
                className="filter-input"
            />
        </div>
    );
}

export default BugFilters;