export enum Status {
  PENDING = 'Pendente',
  IN_PROGRESS = 'Em Progresso',
  COMPLETED = 'Concluído',
  FAILED = 'Falhou'
}

export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  CRITICAL = 'Crítica'
}

export type Role = 'Root' | 'Admin' | 'Tester' | 'Viewer' | 'Support';

export interface User {
  id: number;
  username: string;
  role: Role;
  profilePicture?: string;
}

export interface Script {
  id: string;
  name: string;
  type: 'SQL' | 'Shell' | 'Config';
  content: string;
  folder?: string;
}

export interface Version {
  id: string;
  versionNumber: string;
  releaseDate: string;
  status: Status;
  scripts: Script[];
  description: string;
}

export interface BuildDoc {
  id: string;
  title: string;
  system: string; // e.g., "Portal", "API"
  content: string;
  lastUpdated: string;
}

export interface UsefulDoc {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface Manual {
  id: string;
  name: string;
  originalName: string;
  path: string;
  type: string;
  size: number;
  uploadDate: string;
  parentId?: string;
  isFolder: boolean;
}

export interface TestCase {
  id: string;
  title: string;
  preconditions: string;
  steps: string;
  expectedResult: string;
  status: Status;
  estimatedTime?: string;
  priority?: Priority;
  assignedTo?: string;
}

export interface TestPlan {
  id: string;
  name: string; // e.g., "Versão LTS 2.0"
  description: string;
  testCases: TestCase[];
  progress: number;
}

export interface ChangelogItem {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'fix' | 'improvement';
  category?: string;
  image?: string;
}

export interface ChangelogEntry {
  id: string;
  systemId: string;
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  items: ChangelogItem[];
}

export interface ChangelogSystem {
  id: string;
  name: string;
  description: string;
}

export interface AuditLog {
  id: number;
  userId: number | null;
  username: string;
  action: string;
  module: string;
  resourceId: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}
