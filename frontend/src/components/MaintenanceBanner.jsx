import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import client from '../api/client';

const MaintenanceBanner = () => {
    const [config, setConfig] = useState(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Use a generic meta check or a direct system status check if available
                // For now, we'll try to get it from the market overview which is often cached or fast
                const { data } = await client.get('/api/market/overview');
                if (data && data.maintenance) {
                    setConfig({
                        message: data.maintenance_msg || "Server is under heavy load. Some data might be delayed.",
                        type: data.maintenance_type || "warning"
                    });
                }
            } catch (err) {
                console.error("Failed to check system status");
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 300000); // Check every 5 mins
        return () => clearInterval(interval);
    }, []);

    if (!config || dismissed) return null;

    return (
        <div className={`w-full py-2 px-4 flex items-center justify-between z-[100] ${config.type === 'error' ? 'bg-red-950/90 border-b border-red-500/50' : 'bg-amber-950/90 border-b border-amber-500/50'
            }`}>
            <div className="flex items-center gap-3">
                <AlertTriangle className={`w-4 h-4 ${config.type === 'error' ? 'text-red-500' : 'text-amber-500'}`} />
                <span className="text-xs font-medium text-white/90">
                    {config.message}
                </span>
            </div>
            <button
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
                <X className="w-4 h-4 text-white/50" />
            </button>
        </div>
    );
};

export default MaintenanceBanner;
