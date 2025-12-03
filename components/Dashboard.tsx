import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TestPlan, Version, Status } from '../types';

interface DashboardProps {
  testPlans: TestPlan[];
  versions: Version[];
}

export const Dashboard: React.FC<DashboardProps> = ({ testPlans, versions }) => {
  // Calculate Stats
  const activeVersions = versions.length;
  const pendingBuilds = versions.filter(v => v.status === Status.PENDING || v.status === Status.IN_PROGRESS).length;

  const totalTests = testPlans.reduce((acc, plan) => acc + plan.testCases.length, 0);
  const passedTests = testPlans.reduce((acc, plan) =>
    acc + plan.testCases.filter(c => c.status === Status.COMPLETED).length, 0
  );

  const testCompletionRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  const calculateTotalEstimatedTime = () => {
    let totalMinutes = 0;
    testPlans.forEach(plan => {
      plan.testCases.forEach(c => {
        if (c.estimatedTime) {
          const [hours, minutes] = c.estimatedTime.split(':').map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            totalMinutes += (hours * 60) + minutes;
          }
        }
      });
    });
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  const totalEstimatedTime = calculateTotalEstimatedTime();

  const data = testPlans.map(plan => ({
    name: plan.name,
    total: plan.testCases.length,
    passed: plan.testCases.filter(c => c.status === Status.COMPLETED).length,
    pending: plan.testCases.filter(c => c.status === Status.PENDING || c.status === Status.IN_PROGRESS).length,
    failed: plan.testCases.filter(c => c.status === Status.FAILED).length
  }));

  // Calculate Cases per User
  const casesPerUser = testPlans.reduce((acc, plan) => {
    plan.testCases.forEach(c => {
      const user = c.assignedTo || 'Não atribuído';
      acc[user] = (acc[user] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const userData = Object.entries(casesPerUser).map(([name, count]) => ({ name, count }));

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-medium text-slate-900 dark:text-slate-100 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-slate-600 dark:text-slate-300">{entry.name}:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Versões Ativas</h3>
          <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{activeVersions}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Builds Pendentes</h3>
          <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{pendingBuilds}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Taxa de Execução</h3>
          <p className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{testCompletionRate}%</p>
          <p className="text-xs text-slate-400 mt-1">{passedTests} de {totalTests} testes</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Tempo Estimado Total</h3>
          <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{totalEstimatedTime}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Test Execution Chart */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 md:mb-6">Execução de Testes por Plano</h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'currentColor', opacity: 0.1 }}
                />
                <Bar dataKey="passed" name="Passou" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                <Bar dataKey="pending" name="Pendente" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" name="Falhou" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cases per User Chart */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 md:mb-6">Casos de Teste por Usuário</h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} opacity={0.2} />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'currentColor', opacity: 0.1 }}
                />
                <Bar dataKey="count" name="Casos" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};