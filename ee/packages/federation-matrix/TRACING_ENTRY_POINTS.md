# Federation Tracing Entry Points

This document identifies the entry points where root traces should be created for federation operations.

## Entry Points for Root Traces

### 1. Incoming Messages from Matrix Transactions

**Entry Point:** `PUT /_matrix/federation/v1/send/:txnId`

- **Location:** `ee/packages/federation-matrix/src/api/_matrix/transactions.ts:335`
- **Flow:**
  1. HTTP endpoint receives transaction → creates root trace (via tracer middleware)
  2. Calls `federationSDK.processIncomingTransaction(body)`
  3. Which calls `eventService.notify()` → `event.service.ts:907`
  4. Which emits `eventEmitterService.emit('homeserver.matrix.message', ...)` → `event.service.ts:925`
  5. Which is handled by `federationSDK.eventEmitterService.on('homeserver.matrix.message', ...)` → `message.ts:114`

**Problem:** The `homeserver.matrix.message` event becomes a child of the HTTP request trace, but it should be its own root trace since it represents an independent operation.

**Solution:** When emitting `homeserver.matrix.*` events from `notify()`, they should create root spans by using `ROOT_CONTEXT` instead of the active context.

### 2. Incoming Invites from Matrix Transactions

**Entry Point:** `PUT /_matrix/federation/v1/send/:txnId` (same as messages)

- **Flow:**
  1. HTTP endpoint → `federationSDK.processIncomingTransaction()`
  2. → `eventService.notify()` → emits `homeserver.matrix.membership` (invite type)
  3. → Handled by `member.ts:120` (`handleInvite`)

**Problem:** Same as messages - becomes child of HTTP request trace.

### 3. Incoming Invites from Matrix Invite Endpoint

**Entry Point:** `PUT /_matrix/federation/v2/invite/:roomId/:eventId`

- **Location:** `ee/packages/federation-matrix/src/api/_matrix/invite.ts:135`
- **Flow:**
  1. HTTP endpoint → creates root trace (via tracer middleware)
  2. Calls `federationSDK.processInvite(event, eventId, roomVersion, strippedStateEvents)`
  3. Which eventually processes the invite and may emit events

**Note:** This endpoint should already be a root trace via the tracer middleware.

### 4. Outgoing Invites (User Calls Invite Endpoint)

**Entry Point:** `POST /v1/rooms.invite`

- **Location:** `apps/meteor/app/api/server/v1/rooms.ts:1083`
- **Flow:**
  1. HTTP endpoint → creates root trace (via tracer middleware)
  2. Calls `FederationMatrix.handleInvite(roomId, userId, action)` OR
  3. Triggers `beforeAddUserToRoom` hook → `ee/server/hooks/federation/index.ts:105`
  4. Which calls `FederationMatrix.inviteUsersToRoom(room, [user.username], inviter)` → `FederationMatrix.ts:581`
  5. Which calls `federationSDK.inviteUserToRoom()`

**Note:** This endpoint should already be a root trace via the tracer middleware.

## Current Problem

When `eventEmitterService.emit('homeserver.matrix.*')` is called from within `notify()`, it's being called from within the context of the HTTP request trace (`PUT /_matrix/federation/v1/send/:txnId`). This causes all `homeserver.matrix.*` events to become children of the HTTP request trace instead of being independent root traces.

## Solution

Modify the `EventEmitterService.emit()` method in the homeserver SDK to:

1. Detect when emitting `homeserver.*` events (incoming Matrix operations)
2. Use `ROOT_CONTEXT` instead of the active context to create root spans
3. This ensures each incoming Matrix operation gets its own independent trace

The same should be done for `EventEmitterService.on()` handlers to ensure they also create root spans when handling incoming Matrix events.
