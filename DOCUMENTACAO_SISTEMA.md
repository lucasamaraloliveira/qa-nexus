# Documentação do Sistema - QA Nexus

## 1. Visão Geral
O **QA Nexus** é uma plataforma centralizada para gestão de qualidade (QA), controle de versões, documentação e auditoria. Ele serve como um hub para equipes de QA e desenvolvimento, permitindo o gerenciamento de planos de teste, scripts de banco de dados, manuais e logs de auditoria.

## 2. Arquitetura Técnica

O sistema é construído utilizando uma arquitetura moderna de Single Page Application (SPA) com um backend em Node.js.

### Frontend
- **Framework**: React 19 (com TypeScript)
- **Build Tool**: Vite
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React
- **Gerenciamento de Estado**: Context API (AuthContext, LayoutContext, ThemeContext, SocketContext)
- **Comunicação Real-time**: Socket.io-client

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Banco de Dados**: SQLite (arquivo `backend/database.sqlite`)
- **Autenticação**: JWT (JSON Web Tokens)
- **Uploads**: Multer
- **Logs**: Sistema de auditoria personalizado

## 3. Módulos Principais

1.  **Dashboard**: Visão geral com métricas e atalhos.
2.  **Versões & Scripts**: Controle de versões de software e repositório de scripts SQL/Shell. Suporta organização por pastas.
3.  **Docs de Build**: Documentação técnica de processos de build.
4.  **Docs Úteis**: Repositório de conhecimentos gerais e snippets.
5.  **Manuais**: Sistema de arquivos para manuais e procedimentos (suporta upload e pastas).
6.  **Gestão de Testes**: Criação e execução de planos de teste e casos de teste.
7.  **Changelog**: Histórico de mudanças do sistema (gerenciado via UI).
8.  **Audit Logs**: Registro detalhado de ações dos usuários (segurança e rastreabilidade).
9.  **Configurações**: Gerenciamento de usuários, permissões e configurações do sistema.

## 4. Guia de Manutenção

### Como Rodar o Projeto

O projeto é dividido em dois processos terminais (Frontend e Backend).

**Pré-requisitos**: Node.js instalado.

1.  **Backend**:
    ```bash
    cd backend
    npm install  # Apenas na primeira vez
    npm start
    ```
    *O servidor rodará na porta 3001.*

2.  **Frontend**:
    ```bash
    # Na raiz do projeto
    npm install  # Apenas na primeira vez
    npm run dev
    ```
    *O frontend rodará geralmente na porta 3000 ou 5173.*

### Estrutura de Pastas Importante

*   `backend/`: Código do servidor.
    *   `server.ts`: Ponto de entrada do backend.
    *   `routes/`: Rotas da API (endpoints).
    *   `services/`: Lógica de negócios (ex: `auditService.ts`).
    *   `database.ts`: Configuração e queries do SQLite.
*   `components/`: Componentes React (UI).
    *   `Layout.tsx`: Estrutura principal (Sidebar, Header).
    *   `Changelog.tsx`: Modal de novidades.
*   `contexts/`: Gerenciamento de estado global.
*   `services/`: Serviços do frontend (chamadas API).
    *   `apiService.ts`: Centraliza todas as chamadas HTTP.
    *   `permissionService.ts`: Lógica de permissões (RBAC).

### Tarefas de Manutenção Comuns

#### 1. Atualizar a Versão do Sistema
Para lançar uma nova versão (ex: de 3.1.1 para 3.1.2):

1.  **Atualizar `package.json`**: Mude o campo `"version"`.
2.  **Atualizar `components/Layout.tsx`**:
    *   Procure pela string da versão antiga (ex: "3.1.1") e substitua pela nova.
    *   Atualize a lógica de notificação de novidades (`lastSeenVersion`).
3.  **Atualizar `components/Changelog.tsx`**:
    *   Adicione um novo objeto ao array `changes` no início do arquivo.
    *   Siga o padrão existente (versão, data, tipo, features).

#### 2. Adicionar um Novo Módulo
1.  Crie o componente em `components/NovoModulo.tsx`.
2.  Adicione a rota no `App.tsx`.
3.  Registre o módulo em `services/permissionService.ts` (arrays `MODULES` e `DEFAULT_PERMISSIONS`).
4.  Adicione o item de navegação em `components/Layout.tsx` (`navItems`).

#### 3. Gerenciar Permissões
As permissões são baseadas em "Roles" (Root, Admin, Tester, Viewer, Support).
*   A lógica fica em `services/permissionService.ts`.
*   Para alterar quem acessa o quê por padrão, edite `DEFAULT_PERMISSIONS`.

#### 4. Backup do Banco de Dados
O banco de dados é um arquivo único: `backend/database.sqlite`.
*   Para fazer backup, basta copiar este arquivo para um local seguro.
*   Recomenda-se parar o backend antes de copiar para garantir integridade.

#### 5. Debug de Auditoria
Se os logs não estiverem aparecendo:
*   Verifique a tabela `system_settings` no banco de dados.
*   A coluna `audit_config` deve ter o módulo desejado como `true`.
*   O serviço `AuditService` tem um cache de 60 segundos.

---
*Documento gerado em 03/12/2025 para auxiliar na manutenção e evolução do QA Nexus.*
