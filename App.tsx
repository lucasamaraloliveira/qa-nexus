import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { VersionControl } from './components/VersionControl';
import { BuildDocs } from './components/BuildDocs';
import { UsefulDocs } from './components/UsefulDocs';
import { Manuals } from './components/Manuals';
import { TestManager } from './components/TestManager';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ThemeProvider } from './ThemeContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { apiService } from './services/apiService';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './contexts/ToastContext';
import { ActivityTracker } from './components/ActivityTracker';
import { Changelog } from './components/Changelog';
import { ChangelogManager } from './components/ChangelogManager';
import AuditLogs from './components/AuditLogs';
import { SessionExpiryModal } from './components/SessionExpiryModal';
import { Version, BuildDoc, UsefulDoc, TestPlan } from './types';
import { permissionService, MODULES } from './services/permissionService';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isAuthenticated, user } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // App State
  const [versions, setVersions] = useState<Version[]>([]);
  const [docs, setDocs] = useState<BuildDoc[]>([]);
  const [usefulDocs, setUsefulDocs] = useState<UsefulDoc[]>([]);
  const [testPlans, setPlans] = useState<TestPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;

      try {
        const [fetchedVersions, fetchedDocs, fetchedUsefulDocs, fetchedPlans] = await Promise.all([
          apiService.getVersions(),
          apiService.getDocs(),
          apiService.getUsefulDocs(),
          apiService.getTestPlans()
        ]);
        setVersions(fetchedVersions);
        setDocs(fetchedDocs);
        setUsefulDocs(fetchedUsefulDocs);
        setPlans(fetchedPlans);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchData();
  }, [isAuthenticated]);

  // Redirect based on permissions
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user has access to current tab
      if (!permissionService.canAccessModule(activeTab, user.role)) {
        // Find first accessible module
        const firstAllowed = MODULES.find(m => permissionService.canAccessModule(m.id, user.role));
        if (firstAllowed) {
          setActiveTab(firstAllowed.id);
        }
      }
    }
  }, [isAuthenticated, user, activeTab]);

  // Reset active tab on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveTab('dashboard');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    if (showRegister) {
      return <Register onLoginClick={() => setShowRegister(false)} />;
    }
    return <Login onRegisterClick={() => setShowRegister(true)} />;
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard testPlans={testPlans} versions={versions} />;
      case 'versions':
        return <VersionControl versions={versions} setVersions={setVersions} />;
      case 'builds':
        return <BuildDocs docs={docs} setDocs={setDocs} />;
      case 'useful-docs':
        return <UsefulDocs docs={usefulDocs} setDocs={setUsefulDocs} />;
      case 'manuals':
        return <Manuals />;
      case 'tests':
        return <TestManager plans={testPlans} setPlans={setPlans} />;
      case 'settings':
        return <Settings />;
      case 'changelog':
        return <Changelog />;
      case 'changelog-manager':
        return <ChangelogManager />;
      case 'audit-logs':
        return <AuditLogs />;
      default:
        return <Dashboard testPlans={testPlans} versions={versions} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <ActivityTracker currentTab={activeTab} />
      <SessionExpiryModal />
      {renderContent()}
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <LayoutProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </LayoutProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;