# Rocket.Chat – High-Level Architecture Overview

This document provides a high-level overview of Rocket.Chat’s architecture for contributors.
It is intended as an orientation guide before diving into subsystem-specific documentation.

---

## System overview

Rocket.Chat is a real-time communication platform built primarily on Meteor, with a modular
monorepo structure that separates core functionality, shared packages, and enterprise features.

At a high level, the system consists of:

- Clients (Web, Mobile, Desktop)
- Meteor application server
- Shared and feature-specific packages
- Data and messaging infrastructure (MongoDB and NATS)
- Optional enterprise services

---

## Monorepo structure and runtime mapping

| Directory | Purpose | Runtime role |
|---------|--------|--------------|
| `apps/` | Entry points and deployable applications | Client and server applications |
| `packages/` | Core and shared functionality | Loaded by Meteor at runtime |
| `ee/` | Enterprise-specific features and services | Optional, license-gated runtime modules |

---

## Core components

### Meteor

Meteor acts as the primary application runtime:
- Handles client–server communication
- Manages real-time data synchronization
- Loads shared packages at startup

### Shared packages

Packages under `packages/` encapsulate reusable functionality such as:
- Authentication
- Permissions
- Messaging logic
- UI components

### Enterprise services

The `ee/` directory contains enterprise-only features that extend the core platform.
These components integrate with the same runtime but are enabled conditionally.

---

## Data and real-time messaging flow (simplified)

1. A client sends an action (message, reaction, update)
2. The Meteor server processes the request
3. Data is persisted in MongoDB
4. Real-time events are published via NATS
5. Connected clients receive updates instantly

---

## Where to make changes

- UI or client behavior → `apps/`
- Core business logic → `packages/`
- Enterprise features → `ee/`
- Infrastructure and integrations → related server packages

---

This document is intentionally high-level and serves as a starting point for contributors
before exploring detailed subsystem documentation.
