import React, { useState } from 'react';
import { LayoutTemplate, GitBranch, FileText, FlaskConical, Settings, LogOut, Moon, Sun, BookOpen, FolderOpen, ChevronRight, ChevronLeft, X, Menu, User, FileClock, Sparkles, ShieldCheck } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useLayout } from '../contexts/LayoutContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Users } from 'lucide-react';
import { OnlineUsersTray } from './OnlineUsersTray';
import { MobileOnlineUsersModal } from './MobileOnlineUsersModal';
import { Changelog } from './Changelog';
import { permissionService } from '../services/permissionService';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnlineUsersTrayOpen, setIsOnlineUsersTrayOpen] = useState(false);
  const [isMobileOnlineUsersModalOpen, setIsMobileOnlineUsersModalOpen] = useState(false);
  const { isCollapsed, setIsCollapsed, toggleSidebar } = useLayout();
  const { theme, toggleTheme } = useTheme();
  const { user, profilePicture, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const [hasUnreadNews, setHasUnreadNews] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  React.useEffect(() => {
    const lastSeenVersion = localStorage.getItem('lastSeenVersion');
    if (lastSeenVersion !== '3.0') {
      setHasUnreadNews(true);
    }
  }, []);

  // ... imports

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutTemplate },
    { id: 'versions', label: 'Versões & Scripts', icon: GitBranch },
    { id: 'builds', label: 'Docs de Build', icon: FileText },
    { id: 'useful-docs', label: 'Docs Úteis', icon: BookOpen },
    { id: 'manuals', label: 'Manuais', icon: FolderOpen },
    { id: 'tests', label: 'Gestão de Testes', icon: FlaskConical },
    { id: 'changelog-manager', label: 'Changelog', icon: FileClock },
    { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck },
  ].filter(item => user && permissionService.canAccessModule(item.id, user.role));

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans relative transition-colors duration-300">
      {/* Background Ambience (Decorative Blobs) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-pink-200/40 dark:bg-pink-900/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Sidebar for Desktop - Floating & Translucent */}
      <aside
        className={`hidden md:flex flex-col m-2 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 shadow-2xl z-20 relative transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'
          }`}
      >
        {/* Toggle Button - Floating on the Edge */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-9 z-50 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:scale-110 focus:outline-none"
          title={isCollapsed ? "Expandir" : "Recolher"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Header Unified */}
        <div className={`flex items-center h-16 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
          <div className="flex items-center overflow-hidden">
            <div className="h-10 w-10 min-w-[2.5rem] bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-none flex-shrink-0 z-10 transition-transform duration-300 hover:scale-105">
              QA
            </div>
            <div className={`ml-3 transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 translate-x-[-10px]' : 'opacity-100 w-auto translate-x-0'}`}>
              <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 whitespace-nowrap">
                Nexus
              </span>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`flex items-center w-full py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 group ${isCollapsed ? 'justify-center px-0' : 'px-4'
                } ${activeTab === item.id
                  ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400 ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
            >
              <item.icon className={`h-5 w-5 transition-colors flex-shrink-0 ${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'
                } ${!isCollapsed ? 'mr-4' : ''}`} />

              <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-4 mt-auto space-y-3 transition-all duration-300 ${isCollapsed ? 'flex flex-col items-center px-2' : ''}`}>



          {!isCollapsed && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center text-xs font-medium mb-1 text-slate-700 dark:text-slate-200">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Sistema Online
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-4">
                v3.0
              </div>
            </div>
          )}

        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-0 overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto px-6 py-4 md:px-8 md:py-6 scroll-smooth">
          <div className="max-w-[1600px] mx-auto w-full">
            {/* Header - Floating User Controls (Scrolls with content) */}
            <header className="w-full mb-6 z-30 flex justify-between items-center relative">
              {/* Mobile Logo & Menu Trigger */}
              <div className="flex items-center space-x-3 md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2.5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 shadow-sm rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="flex items-center space-x-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-2 rounded-xl border border-white/50 dark:border-slate-800/50 shadow-sm">
                  <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">QA</div>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">Nexus</span>
                </div>
              </div>

              {/* Spacer for Desktop */}
              <div className="hidden md:block"></div>

              {/* Right Side Controls - Minimal Floating Pill */}
              <div className="flex items-center space-x-3">

                {/* User Controls Container - Hidden on Mobile, Visible on Desktop */}
                <div className="hidden md:flex items-center space-x-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 shadow-sm rounded-2xl p-2 transition-all duration-300 hover:shadow-md hover:bg-white dark:hover:bg-slate-900 relative z-50">

                  {/* Online Users Button */}
                  <button
                    onClick={() => setIsOnlineUsersTrayOpen(!isOnlineUsersTrayOpen)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 ${isOnlineUsersTrayOpen ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                    title="Usuários Online"
                  >
                    <div className="relative">
                      <Users className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white dark:border-slate-900"></span>
                      </span>
                    </div>
                    <span className="text-xs font-bold hidden sm:block">{onlineUsers.length}</span>
                  </button>

                  {/* Online Users Tray */}
                  <OnlineUsersTray isOpen={isOnlineUsersTrayOpen} onClose={() => setIsOnlineUsersTrayOpen(false)} />

                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
                    title={theme === 'dark' ? 'Mudar para claro' : 'Mudar para escuro'}
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>

                  {/* Settings Button */}
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                    title="Configurações"
                  >
                    <Settings className="w-5 h-5" />
                  </button>

                  {/* Changelog Button */}
                  <button
                    onClick={() => {
                      setActiveTab('changelog');
                      const savedVersion = localStorage.getItem('app_version');
                      if (savedVersion !== '3.0') {
                        localStorage.removeItem('changelog_seen');
                        localStorage.setItem('app_version', '3.0');
                        setShowChangelog(true);
                      }
                      setHasUnreadNews(false);
                    }}
                    className={`p-2.5 rounded-xl transition-all duration-200 relative ${activeTab === 'changelog' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                    title="Novidades"
                  >
                    <Sparkles className="w-5 h-5" />
                    {hasUnreadNews && (
                      <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                      </span>
                    )}
                  </button>

                  {/* User Info (Compact) */}
                  <div className="flex items-center pl-2 pr-3 space-x-3 border-l border-slate-200 dark:border-slate-700 ml-1">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">{user?.username}</p>
                    </div>
                    <div className="h-9 w-9 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center ring-2 ring-white dark:ring-slate-700 shadow-sm">
                      {profilePicture ? (
                        <img src={profilePicture} alt={user?.username || 'User'} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    className="p-2.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all duration-200"
                    title="Sair"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>


              </div>
            </header>

            {/* Mobile Sidebar (Drawer) */}
            {/* Backdrop */}
            <div
              className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {showChangelog && <Changelog onClose={() => setShowChangelog(false)} version="3.0" />}

            {/* Drawer */}
            <div className={`fixed top-0 left-0 h-full w-72 bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl z-50 transform transition-transform duration-300 ease-out md:hidden flex flex-col border-r border-white/20 dark:border-slate-800/50 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>

              {/* Drawer Header */}
              <div className="p-6 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                    QA
                  </div>
                  <span className="text-xl font-bold text-slate-800 dark:text-slate-100">Nexus</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Nav Items */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === item.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                  >
                    <item.icon className={`mr-4 h-5 w-5 ${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    {item.label}
                  </button>
                ))}

                {/* Divider */}
                <div className="my-4 border-t border-slate-200/50 dark:border-slate-800/50"></div>

                {/* Mobile Specific User Controls (Moved from Navbar) */}
                <div className="space-y-2">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Sistema
                  </div>

                  {/* Online Users */}
                  <button
                    onClick={() => {
                      setIsMobileOnlineUsersModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                  >
                    <div className="relative mr-4">
                      <Users className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-slate-900"></span>
                      </span>
                    </div>
                    Usuários Online
                    <span className="ml-auto bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 py-0.5 px-2 rounded-full text-xs font-bold">
                      {onlineUsers.length}
                    </span>
                  </button>

                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="mr-4 h-5 w-5" /> : <Moon className="mr-4 h-5 w-5" />}
                    {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'settings'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    <Settings className="mr-4 h-5 w-5" />
                    Configurações
                  </button>

                  {/* Changelog */}
                  <button
                    onClick={() => {
                      setActiveTab('changelog');
                      localStorage.setItem('app_version', '3.0'); // Update to new version
                      localStorage.setItem('changelog_seen', 'true'); // Mark as seen
                      setHasUnreadNews(false);
                      setIsMobileMenuOpen(false);
                      setShowChangelog(true); // Show changelog modal
                    }}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'changelog'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    <div className="relative mr-4">
                      <Sparkles className="h-5 w-5" />
                      {hasUnreadNews && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                        </span>
                      )}
                    </div>
                    Novidades
                  </button>
                </div>
              </nav>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                    {profilePicture ? (
                      <img src={profilePicture} alt={user?.username} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user?.username}</p>
                    <span className="text-xs font-medium px-2 py-1 bg-slate-800 rounded text-slate-400">v3.0</span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Sair"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <MobileOnlineUsersModal isOpen={isMobileOnlineUsersModalOpen} onClose={() => setIsMobileOnlineUsersModalOpen(false)} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};