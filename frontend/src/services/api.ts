import axios from 'axios';

// hardcoded for the simplicity sake
const API_BASE_URL = 'http://localhost:3000';

export interface HeaderResponse {
    hash: string;
    header: any;
}

export const getRecentHeaders = async (): Promise<HeaderResponse[]> => {
    const response = await axios.get(`${API_BASE_URL}/headers/recent`);
    return response.data;
};

// Batch verify headers
export const verifyHeadersBatch = async (hashes: string[]) => {
    const response = await axios.post(`${API_BASE_URL}/headers/verify-batch`, {hashes});
    return response.data.results;
};
