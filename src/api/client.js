import { getAuthData } from "../utils/storage";

const BASE_URL = 'http://localhost:3000/api';

export const apiFetch = async (endpoint, options = {}) => {
    const { token } = getAuthData();

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        headers['x-device-token'] = token;
    }

    const reponse = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await reponse.json();

    if (!reponse.ok) {
        throw new Error(data.error || 'API Request Failed');
    }
    return data;
};