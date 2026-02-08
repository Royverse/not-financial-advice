import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface ServiceHealth {
    status: 'healthy' | 'degraded' | 'error' | 'maintenance';
    message: string;
    tooltip?: string;
}

interface SystemHealth {
    status: 'healthy' | 'degraded' | 'error' | 'maintenance';
    services: Record<string, ServiceHealth>;
    last_check: string;
}

export function useApiHealth() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHealth = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/health');
            setHealth(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch system health:', err);
            setError('Failed to fetch system health');
            setHealth({
                status: 'error',
                services: {},
                last_check: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealth();
        // Poll every 60 seconds
        const interval = setInterval(fetchHealth, 60000);
        return () => clearInterval(interval);
    }, [fetchHealth]);

    return { health, loading, error, refreshHealth: fetchHealth };
}
