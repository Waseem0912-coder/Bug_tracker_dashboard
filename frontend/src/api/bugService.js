import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

export const getBugs = () => {
    return apiClient.get('/bugs/');
};

export const updateBugStatus = (uniqueId, newStatus) => {
    return apiClient.patch(`/bugs/${uniqueId}/`, { status: newStatus });
};

export const triggerEmailCheck = () => {
    return apiClient.post('/trigger-email-check/');
};