import React from 'react';
import { updateBugStatus } from '../api/bugService';

function BugItem({ bug, onUpdate }) {

    const handleStatusChange = async (newStatus) => {
        try {
            await updateBugStatus(bug.unique_id, newStatus);
            if (onUpdate) {
                onUpdate();
            }
            alert(`Bug ${bug.unique_id} status updated to ${newStatus}`);
        } catch (error) {
            console.error("Failed to update bug status:", error);
            alert(`Failed to update status for ${bug.unique_id}`);
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
            <h3>{bug.subject} ({bug.unique_id})</h3>
            <p><strong>Status:</strong> {bug.status}</p>
            <p><strong>Priority:</strong> {bug.priority}</p>
            <p><strong>Assignee:</strong> {bug.assignee || 'N/A'}</p>
            <p><strong>Description:</strong></p>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{bug.description}</pre>
            <p><small>Last Updated: {new Date(bug.updated_at).toLocaleString()}</small></p>

            {bug.status !== 'RESOLVED' && (
                <button onClick={() => handleStatusChange('RESOLVED')}>Mark as Resolved</button>
            )}
            {bug.status !== 'CLOSED' && (
                <button onClick={() => handleStatusChange('CLOSED')} style={{ marginLeft: '5px' }}>Mark as Closed</button>
            )}
        </div>
    );
}

export default BugItem;
