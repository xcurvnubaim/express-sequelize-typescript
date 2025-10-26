# ESLint and Husky Integration Guide

This project now includes ESLint for code quality enforcement and Husky for Git hooks.

## What's Installed

### ESLint

- **eslint**: Main linting tool
- **@typescript-eslint/parser**: TypeScript parser for ESLint
- **@typescript-eslint/eslint-plugin**: TypeScript-specific linting rules
- **eslint-config-prettier**: Disables ESLint rules that conflict with Prettier
- **eslint-plugin-prettier**: Runs Prettier as an ESLint rule

### Prettier

- **prettier**: Code formatter

### Husky & Lint-Staged

- **husky**: Git hooks manager
- **lint-staged**: Run linters on staged files only

## Available Scripts

```bash
# Check for linting errors
bun run lint

# Auto-fix linting errors
bun run lint:fix

# Format code with Prettier
bun run format

# Check if code is formatted
bun run format:check
```

## Pre-commit Hook

Husky is configured to run automatically before each commit. It will:

1. Run ESLint on staged TypeScript files
2. Run Prettier on staged TypeScript and JSON files
3. Only allow the commit if all checks pass

### How to Use

1. **Stage your files**:

   ```bash
   git add .
   ```

2. **Commit** (pre-commit hook runs automatically):

   ```bash
   git commit -m "Your commit message"
   ```

3. If there are linting errors:
   - Fix them manually, or
   - Run `bun run lint:fix` to auto-fix

### Bypass Hook (Use sparingly!)

If you need to bypass the pre-commit hook (not recommended):

```bash
git commit --no-verify -m "Your message"
```

## Configuration Files

- **eslint.config.js**: ESLint configuration (flat config format)
- **.prettierrc**: Prettier formatting rules
- **.prettierignore**: Files to ignore for Prettier
- **.eslintignore**: Files to ignore for ESLint
- **.husky/pre-commit**: Pre-commit hook script
- **package.json** (`lint-staged` section): Configuration for lint-staged

## ESLint Rules

Current configuration:

- TypeScript recommended rules
- Prettier integration
- Warnings for:
  - `any` types (should specify proper types)
  - Unused variables (must start with `_` to be allowed)
- Node.js globals are recognized (process, Buffer, console, etc.)
- Console statements allowed only for `console.warn()` and `console.error()`

## Customizing Rules

To modify ESLint rules, edit `eslint.config.js`:

```javascript
rules: {
  '@typescript-eslint/no-explicit-any': 'warn', // Change to 'error' or 'off'
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  // Add more custom rules here
}
```

## Prettier Configuration

Modify `.prettierrc` to change formatting preferences:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## Troubleshooting

### Husky hook not running

```bash
# Re-initialize Husky
bun run prepare
```

### Too many linting errors

```bash
# Fix auto-fixable issues first
bun run lint:fix

# Then check remaining issues
bun run lint
```

### Skip linting for specific lines

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = fetchData();
```

## Integration with VS Code

Install the following extensions:

- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)

Add to your VS Code settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Best Practices

1. **Fix linting issues as you code** - Don't let them accumulate
2. **Run `bun run lint` before committing** - Catch issues early
3. **Use proper TypeScript types** - Avoid `any` when possible
4. **Follow the Prettier formatting** - Consistent code style
5. **Write meaningful commit messages** - Husky ensures quality, you ensure clarity
