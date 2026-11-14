<p align="center">
  <img src="https://github.com/RocketChat/Rocket.Chat.Artwork/raw/master/Logos/2020/png/logo-horizontal-red.png" width="400" alt="Rocket.Chat logo" />
</p>

<h1 align="center">
  Rocket.Chat: interoperable by design, governed by you
</h1>

<p align="center">
  <img src="https://img.shields.io/github/v/release/RocketChat/Rocket.Chat?label=version" alt="Latest version">
  <img src="https://img.shields.io/github/actions/workflow/status/RocketChat/Rocket.Chat/build_and_test.yml" alt="Build status">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT license"></a>
  <img src="https://img.shields.io/codecov/c/github/RocketChat/Rocket.Chat/develop" alt="Code coverage">
</p>

<p align="center">
  <a href="https://docs.rocket.chat/docs/deploy-rocketchat"><b>Deploy</b></a> ·
  <a href="https://docs.rocket.chat/docs/rocketchat"><b>Documentation</b></a> ·
  <a href="https://open.rocket.chat"><b>Community</b></a>
</p>

[Rocket.Chat](https://www.rocket.chat) is an open-source, secure communications platform built in TypeScript. It brings messaging, voice, video, and apps together under one security model, so you can work with agencies, allies, and partners even when they run different systems.

You decide where your data lives and which jurisdiction governs it. Run Rocket.Chat on premises, in a secure or sovereign cloud, or fully air-gapped. Defense, intelligence, public sector, and critical infrastructure organizations rely on Rocket.Chat for communications they control end to end.


# 🚀 Why Rocket.Chat

- **Interoperability:** Native, server-to-server federation with Matrix, with XMPP federation available as an alpha feature, and no bridge in the middle. Partners keep their own systems, and every federated message keeps its real sender. [Learn about federation](https://docs.rocket.chat/docs/rocketchat-native-federation).
- **Sovereignty:** Self-host, deploy in a sovereign cloud, or run air-gapped. Your data stays where you put it. [Explore deployment options](https://docs.rocket.chat/docs/deploy-rocketchat).
- **Security:** Zero Trust by design, with role-based and attribute-based access control, end-to-end encryption, identity management, retention policies, and audit logs. [Secure your workspace](https://docs.rocket.chat/docs/secure-rocketchat).
- **Resilience:** Keep communicating in disconnected, intermittent, or limited-bandwidth (DDIL) conditions and during network outages.
- **Flexibility:** Build custom apps, workflows, and integrations with REST APIs, SDKs, and the Apps-Engine, without vendor lock-in. [Extend and integrate](https://docs.rocket.chat/docs/extend-and-integrate-rocketchat-capabilities).

# 🧭 Platform overview

Rocket.Chat covers two areas under a single security model:

- **Collaborate:** Messaging, threads, voice calls, video calls, screen sharing, and file sharing in channels, teams, and direct messages. [Collaborate using Rocket.Chat](https://docs.rocket.chat/docs/collaborate-using-rocketchat).
- **Extend:** Install apps from the Rocket.Chat Marketplace, build your own with the [Apps-Engine](https://developer.rocket.chat/docs/rocketchat-apps-engine), and connect external systems through the [REST API](https://developer.rocket.chat/apidocs).

> Some capabilities, such as video calls and advanced identity management, are available on paid plans. Compare [plans](https://www.rocket.chat/pricing) for details.

# 💻 Deploy Rocket.Chat

Choose the deployment method that fits your environment:

- **Self-hosted:** Deploy on your own servers with Docker, Podman, or Kubernetes. See the [deployment guide](https://docs.rocket.chat/docs/deploy-rocketchat) and check the [system requirements](https://docs.rocket.chat/docs/system-requirements) first. For a quick Kubernetes setup where you don't manage each dependency, use [Launchpad](https://docs.rocket.chat/docs/deploy-with-launchpad).
- **Air-gapped:** Run Rocket.Chat on an isolated network with no internet access. See [air-gapped deployment](https://docs.rocket.chat/docs/rocketchat-air-gapped-deployment).
- **Cloud-hosted:** Let us run the infrastructure for you with dedicated, secure [cloud hosting](https://docs.rocket.chat/docs/rocketchat-cloud-hosting-service-level-agreement-sla).
- **Federated:** Connect your workspace to Matrix and XMPP networks with [native federation](https://docs.rocket.chat/docs/rocketchat-native-federation).

Not sure where to start? Visit [Get started](https://www.rocket.chat/get-started).

# 📱 Desktop and mobile apps

Use Rocket.Chat in the browser, or download the apps.

**Mobile**

[![Rocket.Chat on Apple App Store](https://user-images.githubusercontent.com/551004/29770691-a2082ff4-8bc6-11e7-89a6-964cd405ea8e.png)](https://itunes.apple.com/us/app/rocket-chat/id1148741252?mt=8) [![Rocket.Chat on Google Play](https://user-images.githubusercontent.com/551004/29770692-a20975c6-8bc6-11e7-8ab0-1cde275496e0.png)](https://play.google.com/store/apps/details?id=chat.rocket.android)

**Desktop**

- [macOS: Mac App Store](https://apps.apple.com/us/app/rocket-chat/id1086818840?mt=12)
- [Windows: Microsoft Store](https://apps.microsoft.com/detail/9nblggh52jv6)
- [Linux: Snapcraft](https://snapcraft.io/rocketchat-desktop), or run `sudo snap install rocketchat-desktop`

For more options, see [Desktop and mobile apps](https://docs.rocket.chat/docs/desktop-mobile-apps) or [download the apps](https://www.rocket.chat/download-apps).

# 📖 Documentation

| Audience | Resource |
|---|---|
| Users | [User guide](https://docs.rocket.chat/docs/rocketchat) |
| Administrators | [Administrator's guide](https://docs.rocket.chat/docs/administrators-guide) |
| Integrators | [API documentation](https://developer.rocket.chat/apidocs) |
| Everyone | [Release notes](https://docs.rocket.chat/docs/rocketchat-release-notes) and the [YouTube Learning Center](https://www.youtube.com/playlist?list=PLee3gqXJQrFVXnNs5GiuoTMy269ydvcOB) |

# 🛡️ Trust and compliance

Rocket.Chat is built for organizations that work in high-stakes, regulated environments. It supports Zero Trust architectures and aligns with frameworks such as GDPR, SOC 2, ISO/IEC 27001, and HIPAA. Its Defense plan offers post-quantum encryption options and deployments up to IL6.

- **[Trust Center](https://trust.rocket.chat/):** Our security practices, privacy commitments, certifications, and governance policies.
- **[Compliance Center](https://docs.rocket.chat/docs/compliance-center):** How Rocket.Chat helps you meet your compliance requirements.

# 🛠️ Develop with Rocket.Chat

Set up a development environment for each part of the platform:

- **[Server](https://developer.rocket.chat/docs/server):** Set up the server on Linux, Windows, macOS, or Gitpod.
- **[Desktop](https://developer.rocket.chat/docs/desktop-app):** Build and customize the desktop app. Contribute to [Rocket.Chat.Electron](https://github.com/RocketChat/Rocket.Chat.Electron).
- **[Mobile](https://developer.rocket.chat/docs/mobile-app):** Build the mobile app and configure push notifications. Contribute to [Rocket.Chat.ReactNative](https://github.com/RocketChat/Rocket.Chat.ReactNative).
- **[Apps-Engine](https://developer.rocket.chat/docs/rocketchat-apps-engine):** Build apps that extend Rocket.Chat with the open-source Apps-Engine framework, and publish them through the [app publisher portal](https://marketplace.rocket.chat/publisher/apps).

# 🤝 Contribute

Rocket.Chat is open source, and we welcome contributions of all kinds. Read the [contribution guide](https://developer.rocket.chat/docs/contribute-to-rocketchat) to get started.

**Feature requests:** Open a request in [Rocket.Chat/feature-requests](https://github.com/RocketChat/feature-requests/issues/new?template=feature_request.md). Requests from before 2018 are archived in the [feature request forum](https://forums.rocket.chat/c/feature-requests/8).

![Repobeats analytics image](https://repobeats.axiom.co/api/embed/1efe0f0a7c366bd58068a1ab1f555ab912ec3895.svg "Repobeats analytics image")

# 💬 Community and support

- Join our [community server](https://open.rocket.chat) and ask questions in [#support](https://open.rocket.chat/channel/support) or say hello in [#general](https://open.rocket.chat/channel/general).
- Browse and post in the [Rocket.Chat forums](https://forums.rocket.chat).
- Customers can reach our team through the [support desk](https://desk.rocket.chat).
- Looking for a partner to deploy or integrate Rocket.Chat? [Find a partner](https://www.rocket.chat/partners/find-a-partner).
- Interested in Rocket.Chat for your organization? [Talk to sales](https://www.rocket.chat/sales-contact) or [request a demo](https://www.rocket.chat/demo-request).

# 💼 Become a Rocketeer

We're hiring engineers, technical support specialists, and product managers. See our [open roles](https://www.rocket.chat/jobs).

# 🗞️ Stay up to date

- [Blog](https://www.rocket.chat/blog)
- [X (Twitter)](https://twitter.com/RocketChat)
- [LinkedIn](https://www.linkedin.com/company/rocket-chat)
- [YouTube](https://www.youtube.com/channel/UCin9nv7mUjoqrRiwrzS5UVQ)
- [Facebook](https://www.facebook.com/RocketChatApp)
