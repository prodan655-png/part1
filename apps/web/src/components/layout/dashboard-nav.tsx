'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderKanban, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

export function DashboardNav() {
    const pathname = usePathname();
    const { logout } = useAuth();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Sites', href: '/dashboard/sites', icon: FolderKanban },
        { name: 'Settings', href: '/dashboard/settings/integrations', icon: Settings },
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === href;
        }
        return pathname?.startsWith(href);
    };

    return (
        <nav className="border-b bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/dashboard" className="text-xl font-bold text-primary">
                                SEO Audit
                            </Link>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${active
                                                ? 'text-primary bg-primary/10'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4 mr-2" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right side - Logout */}
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
