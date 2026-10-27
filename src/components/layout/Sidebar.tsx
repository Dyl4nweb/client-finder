'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLeads } from '@/context/LeadsContext';
import { useAuth } from '@/context/AuthContext';
import { usePin } from '@/context/PinContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { ChangePinModal } from '@/components/auth/ChangePinModal';
import {
  LayoutDashboard,
  Search,
  Users,
  Menu,
  X,
  User,
  LogIn,
  Compass,
  Lock,
  KeyRound,
  Crown,
  LogOut,
} from 'lucide-react';
import { VarexAvatar } from '@/components/assistant/VarexAvatar';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { leads } = useLeads();
  const { user, signOut } = useAuth();
  const { lock } = usePin();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      name: 'Find Clients',
      href: '/search',
      icon: Search,
      active: pathname === '/search',
    },
    {
      name: 'Saved Leads',
      href: '/leads',
      icon: Users,
      badge: leads.length > 0 ? leads.length : undefined,
      active: pathname === '/leads',
    },
    {
      name: 'Varex AI',
      href: '/assistant',
      icon: null,
      customAvatar: true,
      badge: 'AI Engine',
      isAi: true,
      active: pathname === '/assistant',
    },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-neutral-900 rounded-md flex items-center justify-center text-white">
            <Compass className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-neutral-900">
            ClientFinder
          </span>
        </div>
        <div className="flex items-center gap-1">
          {user && (
            <button
              onClick={async () => {
                await signOut();
                lock();
              }}
              className="p-1.5 text-neutral-500 hover:text-red-600 rounded-md hover:bg-neutral-100 transition-colors"
              title="Log Out"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => lock()}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-100"
            title="Lock App"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-100"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } h-screen`}
      >
        <div>
          {/* Logo & Brand */}
          <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 bg-neutral-900 text-white rounded-lg flex items-center justify-center shadow-xs group-hover:bg-neutral-800 transition-colors">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-semibold text-sm tracking-tight text-neutral-900 block leading-tight">
                  ClientFinder
                </span>
                <span className="text-[10px] text-neutral-400 font-medium tracking-wide uppercase">
                  Prospect Discovery
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
              Main Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    item.active
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.customAvatar ? (
                      <VarexAvatar size="xs" />
                    ) : Icon ? (
                      <Icon className={`w-4 h-4 ${item.active ? 'text-white' : 'text-neutral-400'}`} />
                    ) : null}
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.isAi
                          ? item.active
                            ? 'bg-cyan-400 text-neutral-950 font-bold'
                            : 'bg-gradient-to-r from-cyan-50 to-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                          : item.active
                          ? 'bg-neutral-700 text-neutral-200'
                          : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* PIN Security Section in Menu */}
          <div className="px-3 pt-3 space-y-1">
            <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
              Security
            </div>
            <button
              type="button"
              onClick={() => lock()}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-neutral-400" />
                <span>Lock Application</span>
              </div>
              <span className="text-[10px] bg-neutral-100 border border-neutral-200 text-neutral-500 px-1.5 py-0.5 rounded">
                Protected
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPinModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-neutral-400" />
              <span>Change PIN Code</span>
            </button>
          </div>
        </div>

        {/* User Account / Auth Section at Bottom */}
        <div className="p-3 border-t border-neutral-200 bg-neutral-50/50 space-y-2">
          {user ? (
            <div className="space-y-2">
              <div
                onClick={() => {
                  setAuthModalOpen(true);
                  setMobileOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 transition-all cursor-pointer shadow-2xs"
                title="Click to view account settings"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-7 h-7 rounded-full bg-neutral-900 text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-neutral-900 truncate">
                      {user.email}
                    </p>
                    <p className="text-[10px] text-amber-700 font-medium">
                      Verified Sole Owner
                    </p>
                  </div>
                </div>
                <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                  Owner
                </span>
              </div>

              {/* Prominent Direct Logout Button */}
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  lock();
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5 text-red-600" />
                <span>Log Out (Sign Out)</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthModalOpen(true);
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors cursor-pointer text-left shadow-xs"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-7 h-7 rounded-md bg-neutral-800 text-amber-400 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold truncate">
                    Sign In as Owner
                  </p>
                  <p className="text-[10px] text-neutral-300 truncate">
                    Personal Account
                  </p>
                </div>
              </div>
              <LogIn className="w-3.5 h-3.5 text-neutral-300 shrink-0 ml-1" />
            </button>
          )}
        </div>
      </aside>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Change PIN Modal */}
      <ChangePinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
      />
    </>
  );
};
