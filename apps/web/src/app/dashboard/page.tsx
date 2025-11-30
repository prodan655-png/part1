'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
            <p>Welcome back, {user.email}!</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/dashboard/sites" className="p-6 bg-white rounded-lg shadow border hover:shadow-lg transition-shadow cursor-pointer">
                    <h3 className="text-lg font-semibold mb-2">My Sites</h3>
                    <p className="text-gray-600">Manage your websites and projects.</p>
                </Link>
                <div className="p-6 bg-white rounded-lg shadow border opacity-50 cursor-not-allowed">
                    <h3 className="text-lg font-semibold mb-2">Recent Audits</h3>
                    <p className="text-gray-600">View your latest content audits.</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow border opacity-50 cursor-not-allowed">
                    <h3 className="text-lg font-semibold mb-2">Alerts</h3>
                    <p className="text-gray-600">Check important notifications.</p>
                </div>
            </div>
        </div>
    );
}
