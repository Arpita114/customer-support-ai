# 🤝 Contributing to Customer Support AI

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 📋 Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/Arpita114/customer-support-ai.git`
3. Install dependencies: `npm run install:all`
4. Setup Ollama: `npm run setup:ollama`
5. Start development: `npm run dev`

## 🌿 Branch Naming

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## ✅ Before Submitting

- [ ] Code follows TypeScript best practices
- [ ] All tests pass: `npm test`
- [ ] Type check passes: `npm run lint`
- [ ] No console errors in browser
- [ ] README updated if needed
- [ ] Commit messages are descriptive

## 📝 Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(chat): add typing indicators to chat interface

- Added animated dots component
- Integrated with SSE stream events
```

## 🐛 Reporting Bugs

Please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, browser)

## 💡 Feature Requests

Open an issue with:
- Clear description
- Use case
- Proposed solution (optional)

## 🙏 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community

---

*Happy coding!* 🚀
