# Contributing to LabDash

Thank you for your interest in contributing to LabDash! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something great for the homelab community.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/pcamp96/labdash/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Docker version, etc.)

### Suggesting Features

1. Check [Discussions](https://github.com/pcamp96/labdash/discussions) for existing suggestions
2. Open a new discussion with:
   - Use case and problem it solves
   - Proposed solution
   - Alternative solutions considered
   - Mockups or examples (if applicable)

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/labdash.git
   cd labdash
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the code style (see below)
   - Add tests if applicable
   - Update documentation

4. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add amazing feature"
   git commit -m "fix: resolve container refresh bug"
   git commit -m "docs: update agent deployment guide"
   ```

   Commit types:
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation changes
   - `style`: Code style changes (formatting, etc.)
   - `refactor`: Code refactoring
   - `test`: Adding tests
   - `chore`: Maintenance tasks

5. **Push and create PR**
   ```bash
   git push origin feature/amazing-feature
   ```

   Then open a pull request on GitHub with:
   - Clear description of changes
   - Link to related issues
   - Screenshots (for UI changes)
   - Testing instructions

## Development Setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Local Development

```bash
# Install dependencies
npm install

# Set up database
export DATABASE_URL="file:./data/labdash.db"
npx prisma migrate dev

# Start development server
npm run dev
```

Visit http://localhost:3000

### Project Structure

```
labdash/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (auth)/      # Authentication pages
│   │   ├── (dashboard)/ # Dashboard pages
│   │   └── api/         # API routes
│   ├── components/      # React components
│   │   ├── ui/         # UI primitives (shadcn)
│   │   └── widgets/    # Dashboard widgets
│   ├── lib/            # Utilities and libraries
│   │   ├── auth/       # Authentication logic
│   │   ├── docker/     # Docker client
│   │   ├── agents/     # Agent manager
│   │   └── services/   # Service integrations
│   ├── hooks/          # Custom React hooks
│   └── types/          # TypeScript types
├── agent/              # LabDash Agent codebase
├── prisma/             # Database schema and migrations
├── docs/               # Documentation
└── scripts/            # Utility scripts
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Use enums for constants

### React

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Avoid inline styles (use Tailwind)
- Extract reusable components

### Naming Conventions

- Components: `PascalCase` (e.g., `DockerContainerList`)
- Files: `kebab-case` (e.g., `docker-container-list.tsx`)
- Functions: `camelCase` (e.g., `fetchContainers`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- Types/Interfaces: `PascalCase` (e.g., `ContainerInfo`)

### File Organization

- One component per file
- Co-locate related files
- Use index files for exports
- Keep files under 300 lines

## Testing

While we don't have automated tests yet, please:

1. Test your changes locally
2. Test on different screen sizes
3. Test with different data states (empty, loading, error)
4. Test edge cases

## Documentation

Update documentation when:

- Adding new features
- Changing APIs
- Modifying configuration
- Adding environment variables
- Creating new components

## Adding Service Integrations

To add a new service integration:

1. **Create service client**
   ```typescript
   // src/lib/services/your-service/YourService.ts
   import { HttpService } from '../base/HttpService';

   export class YourService extends HttpService {
     async getData() {
       return this.request('/api/data');
     }
   }
   ```

2. **Add to service types**
   ```prisma
   // prisma/schema.prisma
   enum ServiceType {
     // ... existing types
     YOUR_SERVICE
   }
   ```

3. **Create widget**
   ```typescript
   // src/components/widgets/YourServiceWidget.tsx
   export function YourServiceWidget(props: WidgetProps) {
     // Widget implementation
   }
   ```

4. **Update documentation**
   - Add to README service list
   - Create integration guide in `docs/integrations/`

## Questions?

- Open a [Discussion](https://github.com/pcamp96/labdash/discussions)
- Ask in pull request comments
- Check existing issues and PRs

Thank you for contributing! 🎉
