\# Contributing to Rocket.Chat



Thank you for your interest in contributing to \*\*Rocket.Chat\*\* — the open-source communications platform used by millions!



We welcome all forms of contributions: code, bug reports, documentation, translations, design, testing, and more.



\## 📋 Table of Contents

\- \[Code of Conduct](#code-of-conduct)

\- \[Security Policy](#security-policy)

\- \[Ways to Contribute](#ways-to-contribute)

\- \[Development Setup](#development-setup)

\- \[Contribution Process](#contribution-process)

\- \[Pull Request Guidelines](#pull-request-guidelines)

\- \[Additional Resources](#additional-resources)



\## Code of Conduct

Please read and follow our \[Code of Conduct](CODE\_OF\_CONDUCT.md). We expect all contributors to maintain a respectful and inclusive environment.



\## Security Policy

If you discover a security vulnerability, please follow our \[Security Policy](SECURITY.md) rather than opening a public issue.



\## Ways to Contribute

You can contribute in many ways:

\- Reporting bugs or suggesting features via \[Issues](https://github.com/RocketChat/Rocket.Chat/issues)

\- Writing or reviewing code

\- Testing new features

\- Improving documentation

\- Helping with localization

\- Contributing to the design system (Fuselage), Apps Engine, or other packages



See the full list in the \[Modes of Contribution](https://developer.rocket.chat/docs/contribute-to-rocket-chat/ways-to-contribute).



\## Development Setup



\*\*Quickest way (recommended for first-time contributors):\*\*

Use \*\*Gitpod\*\* — a fully configured dev environment in the browser:



\[!\[Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/RocketChat/Rocket.Chat)



\*\*Local development:\*\*



1\. Fork and clone the repository:

```bash

git clone https://github.com/YOUR\_USERNAME/Rocket.Chat.git

cd Rocket.Chat

```



2\. Install dependencies (we use Yarn + Turbo monorepo):

```bash

yarn install

```



3\. Start the development server:

```bash

yarn dev

```



Or use the local Docker Compose setup (includes MongoDB, NATS, Traefik, etc.):

```bash

docker compose -f docker-compose-local.yml up

```



4\. The app will be available at `http://localhost:3000`.



Detailed setup guides:

\- \[Gitpod Development Environment](https://developer.rocket.chat/docs/contribute-to-rocket-chat/development-environment/gitpod)

\- \[Local Development Setup](https://developer.rocket.chat/docs/contribute-to-rocket-chat/development-environment/local-dev)

\- \[Repository Structure](https://developer.rocket.chat/docs/contribute-to-rocket-chat/repository-structure)



\## Contribution Process



1\. Find or create an issue — always start here.

2\. Comment on the issue to let maintainers know you are working on it.

3\. Create a branch from `develop`:

```bash

git checkout -b fix/your-feature-name

```



4\. Make your changes following our coding standards.

5\. Test your changes locally:

```bash

yarn testunit

```



6\. Open a Pull Request against the `develop` branch.



Full step-by-step process → \[Contribution Process](https://developer.rocket.chat/docs/contribute-to-rocket-chat/contribution-process)



\## Pull Request Guidelines



\- Follow the PR template (automatically loaded from `.github/PULL\_REQUEST\_TEMPLATE.md`).

\- Keep PRs focused on a single change.

\- Write clear commit messages.

\- Ensure all tests pass before submitting.

\- Update documentation when needed.

\- Link the related issue in your PR description.



We review every PR. Be patient and responsive to feedback.



\## Additional Resources



\- \[Full Contribution Guide](https://developer.rocket.chat/docs/contribute-to-rocket-chat)

\- \[Development Workflow](https://developer.rocket.chat/docs/contribute-to-rocket-chat/development-environment)

\- \[Code Review Process](https://developer.rocket.chat/docs/contribute-to-rocket-chat/code-review-process)

\- \[Repository Structure](https://developer.rocket.chat/docs/contribute-to-rocket-chat/repository-structure)

\- \[Issue Templates](https://github.com/RocketChat/Rocket.Chat/tree/develop/.github/ISSUE\_TEMPLATE)

