# Rocket.Chat Architecture Report

> **Version:** 8.1.0-develop | **Node:** 22.16.0 | **Yarn:** 4.12.0

---

## System Architecture

```mermaid
flowchart TB
    subgraph Clients["Client Layer"]
        Web["🌐 Web App"]
        Desktop["💻 Desktop (Electron)"]
        Mobile["📱 Mobile (React Native)"]
        Livechat["💬 Livechat Widget"]
    end

    subgraph Gateway["API Gateway"]
        Traefik["Traefik Reverse Proxy"]
    end

    subgraph Core["Core Application"]
        Meteor["Meteor Server<br/>apps/meteor"]
    end

    subgraph Microservices["Enterprise Microservices (ee/)"]
        Auth["Authorization Service"]
        Account["Account Service"]
        Presence["Presence Service"]
        DDP["DDP Streamer"]
        Queue["Queue Worker"]
        Transcript["Omnichannel Transcript"]
    end

    subgraph MessageBus["Message Bus"]
        NATS["NATS (Moleculer)"]
    end

    subgraph Storage["Data Layer"]
        MongoDB["MongoDB<br/>(Replica Set)"]
        FileStorage["File Storage<br/>(S3/Local/GridFS)"]
    end

    Clients --> Gateway
    Gateway --> Core
    Gateway --> DDP
    Core <--> NATS
    Microservices <--> NATS
    Core --> MongoDB
    Microservices --> MongoDB
    Core --> FileStorage
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 22.16.0 |
| Framework | Meteor.js |
| Language | TypeScript 5.9.3 |
| Database | MongoDB 6.10 (Replica Set) |
| Message Broker | NATS + Moleculer |
| Build System | Turborepo |
| UI | React + Fuselage |

---

## Monorepo Structure

```
Rocket.Chat/
├── apps/
│   ├── meteor/          # Core server (97 feature modules)
│   └── uikit-playground/
├── packages/            # 55 shared packages
│   ├── core-services/
│   ├── core-typings/
│   ├── apps-engine/
│   ├── livechat/
│   └── ui-*/
└── ee/                  # Enterprise Edition
    ├── apps/            # Microservices
    └── packages/        # License, federation, etc.
```

---

## Enterprise Microservices

```mermaid
flowchart LR
    subgraph Services
        A[Account Service]
        B[Authorization Service]
        C[Presence Service]
        D[DDP Streamer]
        E[Queue Worker]
        F[Transcript Service]
    end
    
    NATS((NATS Bus))
    
    A <--> NATS
    B <--> NATS
    C <--> NATS
    D <--> NATS
    E <--> NATS
    F <--> NATS
    
    subgraph Core
        Meteor[Meteor Core]
    end
    
    Meteor <--> NATS
```

| Service | Purpose |
|---------|---------|
| authorization-service | Permission checks (ABAC) |
| account-service | User operations at scale |
| presence-service | Online/offline status |
| ddp-streamer | WebSocket scaling |
| queue-worker | Background jobs |
| omnichannel-transcript | PDF generation |

---

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Traefik
    participant Meteor
    participant DDP
    participant MongoDB
    participant NATS

    User->>Client: Send message
    Client->>Traefik: HTTP/WebSocket
    Traefik->>Meteor: Route request
    Meteor->>MongoDB: Persist message
    Meteor->>NATS: Publish event
    NATS->>DDP: Broadcast
    DDP->>Client: Real-time update
    Client->>User: Display message
```

---

## Production Deployment

```mermaid
flowchart TB
    subgraph LoadBalancer["Load Balancer"]
        LB[("Traefik/Nginx")]
    end

    subgraph AppServers["Application Tier"]
        RC1["Rocket.Chat Node 1"]
        RC2["Rocket.Chat Node 2"]
        RC3["Rocket.Chat Node N"]
    end

    subgraph Services["Microservices Tier"]
        MS1["Authorization"]
        MS2["Presence"]
        MS3["DDP Streamer"]
    end

    subgraph MessageBus["Message Bus"]
        NATS1["NATS Cluster"]
    end

    subgraph Database["Database Tier"]
        M1[("MongoDB Primary")]
        M2[("MongoDB Secondary")]
        M3[("MongoDB Secondary")]
    end

    subgraph Storage["File Storage"]
        FS[("S3 / MinIO")]
    end

    LB --> AppServers
    LB --> MS3
    AppServers <--> NATS1
    Services <--> NATS1
    AppServers --> Database
    Services --> Database
    AppServers --> FS
```

---

## Core Feature Modules (`apps/meteor/app/`)

| Category | Modules |
|----------|---------|
| **Communication** | livechat, threads, reactions, mentions, e2e |
| **Auth** | 2fa, authentication, authorization, meteor-accounts-saml, custom-oauth |
| **Integrations** | apps, integrations, slackbridge, irc, importer-slack |
| **Providers** | apple, GitHub, GitLab, google-oauth, ldap |

---

## Development Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Start dev server |
| `yarn build` | Production build |
| `yarn lint` | Run ESLint |
| `yarn testunit` | Run unit tests |
