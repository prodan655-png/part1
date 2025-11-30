'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <p>Welcome back, {user.name}!</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-lg shadow border">
                    <h3 className="text-lg font-semibold mb-2">My Sites</h3>
                    <p className="text-gray-600">Manage your websites and projects.</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow border">
                    <h3 className="text-lg font-semibold mb-2">Recent Audits</h3>
                    <p className="text-gray-600">View your latest content audits.</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow border">
                    <h3 className="text-lg font-semibold mb-2">Alerts</h3>
                    <p className="text-gray-600">Check important notifications.</p>
                </div>
            </div>
        </div>
    );
}
