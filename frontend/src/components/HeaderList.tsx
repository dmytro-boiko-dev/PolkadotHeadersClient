import React, {useEffect, useState, useRef} from 'react';
import {getRecentHeaders, verifyHeadersBatch} from '../services/api';
import HeaderItem from './HeaderItem';

export interface Header {
    parentHash: string;
    number: number;
    stateRoot: string;
    extrinsicsRoot: string;
    digest: any; // Adjust the type as necessary
}

interface HeaderResponse {
    hash: string;
    header: Header;
}

interface VerificationResult {
    hash: string;
    isValid: boolean;
    error?: string;
}

const HeaderList: React.FC = () => {
    const [headers, setHeaders] = useState<HeaderResponse[]>([]);
    const [verificationResults, setVerificationResults] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [isPolling, setIsPolling] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    // Use useRef to keep track of the mounted state
    const isMounted = useRef<boolean>(true);

    // Move fetchHeadersAndVerify outside of useEffect
    const fetchHeadersAndVerify = async () => {
        setLoading(true);
        try {
            // Fetch recent headers
            const headersData: HeaderResponse[] = await getRecentHeaders();

            if (!isMounted.current) return;

            setHeaders(headersData);

            if (headersData.length === 0) {
                // No headers available, stop further processing
                return;
            }

            // Extract hashes for batch verification
            const hashes = headersData.map((item) => item.hash);

            // Batch verify headers
            const results: VerificationResult[] = await verifyHeadersBatch(hashes);

            if (!isMounted.current) return;

            // Map verification results by hash
            const verificationMap: Record<string, boolean> = {};
            results.forEach((result) => {
                verificationMap[result.hash] = result.isValid;
            });
            setVerificationResults(verificationMap);
        } catch (error) {
            console.error('Error fetching headers or verification results:', error);
        } finally {
            if (isMounted.current) {
                setLoading(false);
                setIsRefreshing(false);
            }
        }
    };

    useEffect(() => {
        isMounted.current = true;

        // initial fetch
        fetchHeadersAndVerify();

        let intervalId: NodeJS.Timeout | null = null;
        if (isPolling) {
            // poll every 10 seconds
            intervalId = setInterval(fetchHeadersAndVerify, 10000);
        }

        return () => {
            isMounted.current = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isPolling]);

    const handleRefresh = async () => {
        if (isRefreshing) return; // Prevent multiple clicks
        setIsRefreshing(true);
        await fetchHeadersAndVerify();
    };

    const togglePolling = () => {
        setIsPolling((prev) => !prev);
    };

    if (loading) {
        return <div>Loading headers...</div>;
    }

    if (headers.length === 0) {
        return (
            <div>
                <div>There is no data yet.</div>
                <div className="header-controls">
                    <button onClick={handleRefresh} disabled={isRefreshing}>
                        Refresh
                    </button>
                    <button onClick={togglePolling}>
                        {isPolling ? 'Stop Auto-Refresh' : 'Start Auto-Refresh'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="header-controls">
                <button onClick={handleRefresh} disabled={isRefreshing}>
                    Refresh
                </button>
                <button onClick={togglePolling}>
                    {isPolling ? 'Stop Auto-Refresh' : 'Start Auto-Refresh'}
                </button>
            </div>
            {headers.map((item) => (
                <HeaderItem
                    key={item.hash}
                    hash={item.hash}
                    header={item.header}
                    isValid={verificationResults[item.hash]}
                />
            ))}
        </div>
    );
};

export default HeaderList;
