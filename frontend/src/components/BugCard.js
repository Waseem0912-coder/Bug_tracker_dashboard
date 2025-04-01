import React, { useState } from 'react';
import { updateBugStatus } from '../api/bugService';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {

        const options = {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true 
        };
        return new Date(dateString).toLocaleString(undefined, options); 
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString; 
    }
};

function BugCard({ bug, onUpdate }) {
    const [showHistory, setShowHistory] = useState(false); 

    const handleStatusChange = async (newStatus) => {
        if (bug.status === newStatus) return; 

        try {

            await updateBugStatus(bug.unique_id, newStatus);

            if (onUpdate) {
                onUpdate(); 
            }

        } catch (error) {
            console.error("Failed to update bug status:", error);
            alert(`Failed to update status for ${bug.unique_id}. Check console.`);

        }
    };

    const emailLogs = bug.email_logs || [];

    const cardClasses = [
        'bug-card',
        `status-${bug.status?.toLowerCase() || 'unknown'}`,
        `priority-${bug.priority?.toLowerCase() || 'unknown'}`
    ].join(' '); 

    return (
        <div className={cardClasses}>
            
            <div className="bug-card-header">
                <span className="bug-id" title="Unique Bug Identifier">{bug.unique_id}</span>
                <span className={`bug-status bug-status-${bug.status?.toLowerCase()}`}>{bug.status || 'N/A'}</span>
                <span className={`bug-priority bug-priority-${bug.priority?.toLowerCase()}`}>{bug.priority || 'N/A'}</span>
            </div>

            
            <h3 className="bug-subject">{bug.latest_subject || '(No Subject Provided)'}</h3>
            <p className="bug-assignee">
                Assignee: <span className={!bug.assignee ? 'unassigned' : ''}>{bug.assignee || 'Unassigned'}</span>
            </p>

            
            {bug.description && ( 
                <details className="bug-description-details">
                    <summary>Latest Description</summary>
                    <pre className="bug-description">{bug.description}</pre>
                </details>
            )}
            {!bug.description && (
                 <p className="no-description"><em>(No description provided in latest update)</em></p>
            )}

            
            {bug.email_log_count > 0 && ( 
                 <div className="email-history-section">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="toggle-history-button"
                        aria-expanded={showHistory} 
                    >
                        {showHistory ? 'Hide' : 'Show'} Email History ({bug.email_log_count})
                    </button>

                    {showHistory && (
                        <div className="email-log-list">
                            {emailLogs.map(log => (
                                <div key={log.id} className="email-log-item">
                                    <p className="log-timestamp"><strong>Received:</strong> {formatDate(log.received_at)}</p>
                                    <p className="log-subject"><strong>Subject:</strong> {log.email_subject}</p>
                                    
                                    <div className="log-parsed-details">
                                        {log.parsed_status && <small>Status: {log.parsed_status} | </small>}
                                        {log.parsed_priority && <small>Priority: {log.parsed_priority} | </small>}
                                        {log.parsed_assignee && <small>Assignee: {log.parsed_assignee}</small>}
                                        {!(log.parsed_status || log.parsed_priority || log.parsed_assignee) && <small><em>(No specific fields parsed in this email body)</em></small>}
                                    </div>
                                    {log.parsed_description && (
                                        <details className="log-description-details">
                                            <summary>Description in this email</summary>
                                            <pre className="log-description">{log.parsed_description}</pre>
                                        </details>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            
            <div className="bug-card-footer">
                 <div className="timestamps">
                     <small title={`First seen: ${formatDate(bug.created_at)}`}>Created: {formatDate(bug.created_at)}</small>
                     <small title={`Last email processed: ${formatDate(bug.last_email_received_at)}`}>Last Email: {formatDate(bug.last_email_received_at)}</small>
                 </div>
                 <div className="bug-actions">
                     
                     {bug.status !== 'RESOLVED' && bug.status !== 'CLOSED' && (
                         <button onClick={() => handleStatusChange('RESOLVED')} className="action-button resolve" title="Mark as Resolved">Resolve</button>
                     )}
                     {bug.status !== 'CLOSED' && (
                         <button onClick={() => handleStatusChange('CLOSED')} className="action-button close" title="Mark as Closed">Close</button>
                     )}
                     { (bug.status === 'RESOLVED' || bug.status === 'CLOSED') && bug.status !== 'OPEN' && (
                          <button onClick={() => handleStatusChange('OPEN')} className="action-button reopen" title="Re-open this issue">Re-Open</button>
                     )}
                     
                 </div>
            </div>
        </div>
    );
}

export default BugCard;