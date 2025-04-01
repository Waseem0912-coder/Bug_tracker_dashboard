import React, { useState, useEffect, useCallback } from 'react';
import { getBugs } from '../api/bugService';
import BugItem from './BugItem';

function BugList() {
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBugs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getBugs();
            setBugs(response.data); 
        } catch (err) {
            console.error("Failed to fetch bugs:", err);
            setError("Failed to load bugs. Is the backend running?");
        } finally {
            setLoading(false);
        }
    }, []); 

    useEffect(() => {
        fetchBugs();

    }, [fetchBugs]); 

    const handleBugUpdate = () => {
        fetchBugs();
    };

    if (loading) return <p>Loading bugs...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h2>Incoming Bugs / Updates</h2>
            {bugs.length === 0 && <p>No bugs found.</p>}
            {bugs.map(bug => (
                <BugItem key={bug.unique_id} bug={bug} onUpdate={handleBugUpdate} />
            ))}
        </div>
    );
}

export default BugList;