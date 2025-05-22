# Version Management and JSR Publishing

This library uses automated GitHub Actions for semantic versioning and JSR
package publishing.

## 🎯 **Workflow Overview**

Since this is a **TypeScript library** (not a deployed application), the
workflow is focused on:

1. **Version Management**: Semantic versioning with git tags
2. **JSR Publishing**: Package distribution via `deno publish`
3. **GitHub Releases**: Release notes and changelogs

## 🚀 **Automated Version Bumping and Publishing**

### Usage

To trigger an automated version bump and JSR publishing, include one of these
commands in your commit message:

```bash
# Patch version bump (0.0.1 → 0.0.2) - Bug fixes
git commit -m "fix: resolve parsing issue bump(patch)"

# Minor version bump (0.0.2 → 0.1.0) - New features
git commit -m "feat: add new parsing strategy bump(minor)"

# Major version bump (0.1.0 → 1.0.0) - Breaking changes
git commit -m "feat!: breaking API changes bump(major)"
```

### What happens automatically

When you push a commit with a bump command:

1. **✅ Version Update**: Updates version in `deno.json`
2. **✅ Testing**: Runs tests and benchmarks (if available)
3. **✅ Package Validation**: Validates JSR package configuration
4. **✅ JSR Publishing**: Publishes to JSR with `deno publish`
5. **✅ Git Tagging**: Creates version commit and git tag
6. **✅ GitHub Release**: Creates release with changelog

### Example Workflow

```bash
# 1. Make your changes and commit with bump command
git add .
git commit -m "feat: add new data source bump(minor)"
git push origin main

# 2. Automatic execution:
#    ✅ Updates version (0.0.2 → 0.1.0)
#    ✅ Runs tests and benchmarks
#    ✅ Validates package config
#    ✅ Publishes to JSR
#    ✅ Creates git tag v0.1.0
#    ✅ Creates GitHub release
#    ✅ Package available: jsr:@mso/ohlcv@0.1.0
```

## 📦 **JSR Package Configuration**

Ensure your `deno.json` has the correct configuration:

```json
{
  "name": "@mso/ohlcv",
  "version": "0.0.2",
  "license": "MIT",
  "exports": {
    ".": "./mod.ts",
    "./provider": "./src/provider/index.ts",
    "./parser": "./src/parser/index.ts",
    "./types": "./src/core/row.ts",
    "./errors": "./src/core/errors.ts",
    "./utils": "./src/utils/index.ts"
  }
}
```

## 🔍 **Monitoring**

### JSR Package

- **Package Page**: https://jsr.io/@mso/ohlcv
- **Installation**: `deno add jsr:@mso/ohlcv`
- **Documentation**: Auto-generated from TypeScript

### GitHub

- **Actions Tab**: View workflow runs and logs
- **Releases**: Version history and changelogs
- **Tags**: All version tags

## 🚨 **Manual Operations**

### Manual JSR Publishing

```bash
# Publish current version to JSR
deno publish
```

### Manual Version Bump

```bash
# Update deno.json manually and create release
git add deno.json
git commit -m "chore: bump version to v0.0.3"
git tag v0.0.3
git push origin main --tags
```

### Check Package Status

```bash
# Validate package configuration
deno publish --dry-run

# Check current version
deno eval "console.log(JSON.parse(Deno.readTextFileSync('deno.json')).version)"
```

## 🐛 **Troubleshooting**

### Version Bump Issues

1. **No bump detected**: Ensure commit message contains exactly `bump(patch)`,
   `bump(minor)`, or `bump(major)`
2. **Tests fail**: Fix failing tests before version bump will complete
3. **Git permission denied**: Check workflow has `contents: write` permission

### JSR Publishing Issues

1. **Package validation fails**: Check `deno.json` exports configuration
2. **Version already exists**: JSR doesn't allow republishing the same version
3. **Authentication fails**: Check repository OIDC permissions
4. **Module resolution fails**: Ensure all exported modules exist and are valid

### Common Fixes

```bash
# Check for syntax errors in your modules
deno check mod.ts

# Validate exports configuration
deno publish --dry-run

# Test imports work correctly
deno eval "import * as lib from './mod.ts'; console.log(Object.keys(lib))"
```

## 📋 **Version Bump Types**

- **`bump(patch)`**: Bug fixes, small improvements, no breaking changes
  - Example: `0.1.2 → 0.1.3`
- **`bump(minor)`**: New features, additions to API, backward compatible
  - Example: `0.1.3 → 0.2.0`
- **`bump(major)`**: Breaking changes, major refactoring, incompatible API
  changes
  - Example: `0.2.0 → 1.0.0`

## 🎯 **Best Practices**

1. **Test Before Bumping**: Always ensure tests pass before version bumps
2. **Meaningful Commit Messages**: Use conventional commit format
3. **Documentation**: Update README for significant changes
4. **Breaking Changes**: Use `bump(major)` for any breaking API changes
5. **Changelog**: GitHub releases automatically include commit messages

---

**Simple workflow**: Just add `bump(patch/minor/major)` to your commit message
and everything else is automated! 🚀
