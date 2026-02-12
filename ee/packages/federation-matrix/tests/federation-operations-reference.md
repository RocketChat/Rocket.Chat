# Federation Operations - Complete Reference

This document provides a comprehensive reference for all incoming and outgoing federation operations in the Rocket.Chat codebase.

## Operations Rocket.Chat REACTS TO (Incoming from Other Servers)

| Operation | Event/Endpoint | Handler Location | Description | Triggered By |
| --- | --- | --- | --- | --- |
| **EDU - Typing** | `homeserver.matrix.typing` | `ee/packages/federation-matrix/src/events/edu.ts:10` | Broadcast typing indicator to local room | Matrix transaction (EDU) |
| **EDU - Presence** | `homeserver.matrix.presence` | `ee/packages/federation-matrix/src/events/edu.ts:28` | Update federated user presence status | Matrix transaction (EDU) |
| **Invite - Process** | `PUT /_matrix/federation/v2/invite/:roomId/:eventId` | `ee/packages/federation-matrix/src/api/_matrix/invite.ts:135` | Process incoming room invite from remote server | HTTP endpoint |
| **Member - Invite** | `homeserver.matrix.membership` (invite) | `ee/packages/federation-matrix/src/events/member.ts:120` | Create room/subscription for invited user | Matrix transaction |
| **Member - Join** | `homeserver.matrix.membership` (join) | `ee/packages/federation-matrix/src/events/member.ts:197` | Accept user subscription and update room | Matrix transaction |
| **Member - Leave** | `homeserver.matrix.membership` (leave) | `ee/packages/federation-matrix/src/events/member.ts:229` | Remove user from room | Matrix transaction |
| **Message - Text** | `homeserver.matrix.message` | `ee/packages/federation-matrix/src/events/message.ts:114` | Save incoming text message | Matrix transaction |
| **Message - Edit** | `homeserver.matrix.message` (with `m.replace`) | `ee/packages/federation-matrix/src/events/message.ts:154` | Update existing message content | Matrix transaction |
| **Message - Thread** | `homeserver.matrix.message` (with `m.thread`) | `ee/packages/federation-matrix/src/events/message.ts:142` | Process threaded message with tmid | Matrix transaction |
| **Message - Quote/Reply** | `homeserver.matrix.message` (with `m.in_reply_to`) | `ee/packages/federation-matrix/src/events/message.ts:208` | Process quoted/replied message | Matrix transaction |
| **Message - Media** | `homeserver.matrix.message` (with file types) | `ee/packages/federation-matrix/src/events/message.ts:232` | Download and store file/image/video/audio | Matrix transaction |
| **Message - Encrypted** | `homeserver.matrix.encrypted` | `ee/packages/federation-matrix/src/events/message.ts:267` | Process incoming encrypted message | Matrix transaction |
| **Message - Redaction** | `homeserver.matrix.redaction` (for messages) | `ee/packages/federation-matrix/src/events/message.ts:381` | Delete redacted message | Matrix transaction |
| **Ping** | `homeserver.ping` | `ee/packages/federation-matrix/src/events/ping.ts:4` | Debug ping event (console log) | Matrix transaction |
| **Reaction - Add** | `homeserver.matrix.reaction` | `ee/packages/federation-matrix/src/events/reaction.ts:10` | Add reaction to message | Matrix transaction |
| **Reaction - Remove** | `homeserver.matrix.redaction` (for reactions) | `ee/packages/federation-matrix/src/events/reaction.ts:49` | Remove reaction from message | Matrix transaction |
| **Room - Name Change** | `homeserver.matrix.room.name` | `ee/packages/federation-matrix/src/events/room.ts:8` | Update room name | Matrix transaction |
| **Room - Topic Change** | `homeserver.matrix.room.topic` | `ee/packages/federation-matrix/src/events/room.ts:28` | Update room topic | Matrix transaction |
| **Room - Role Change** | `homeserver.matrix.room.role` | `ee/packages/federation-matrix/src/events/room.ts:53` | Update user power level/role in room | Matrix transaction |

## Operations Rocket.Chat TRIGGERS (Outgoing to Other Servers)

| Operation | Method | Location | Description | Called When |
| --- | --- | --- | --- | --- |
| **EDU - Presence** | `sendPresenceUpdateToRooms()` (via event listener) | `ee/packages/federation-matrix/src/FederationMatrix.ts:164` | Send presence update to federated rooms | User presence changed locally |
| **EDU - Typing** | `notifyUserTyping()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:816` | Send typing indicator to Matrix | User typing locally |
| **Event - Get By ID** | `getEventById()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:656` | Retrieve Matrix event by ID | Internal lookup (e.g., for redactions) |
| **Invite - Accept/Reject** | `handleInvite()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:893` | Accept or reject room invite | User accepts/rejects invite |
| **Matrix IDs - Verify** | `verifyMatrixIds()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:846` | Verify Matrix user IDs exist | User verification before invite |
| **Member - Invite** | `inviteUsersToRoom()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:531` | Invite users to federated room | User invited locally |
| **Member - Kick** | `kickUser()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:684` | Kick user from room | User kicked locally |
| **Member - Leave** | `leaveRoom()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:660` | User leaves federated room | User leaves locally |
| **Message - Delete** | `deleteMessage()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:509` | Redact/delete message | Message deleted locally |
| **Message - Quote/Reply** | `sendMessage()` → `handleQuoteMessage()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:432` | Send quoted message | Quoted message sent locally |
| **Message - Send File** | `sendMessage()` → `handleFileMessage()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:326` | Send file/image/video/audio | File message sent locally |
| **Message - Send Text** | `sendMessage()` → `handleTextMessage()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:375` | Send text message | Message sent locally |
| **Message - Thread** | `sendMessage()` → `handleThreadedMessage()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:399` | Send threaded message | Thread message sent locally |
| **Message - Update** | `updateMessage()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:708` | Edit existing message | Message edited locally |
| **Reaction - Add** | `sendReaction()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:565` | Add reaction | Reaction added locally |
| **Reaction - Remove** | `removeReaction()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:602` | Remove reaction | Reaction removed locally |
| **Room - Create** | `createRoom()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:209` | Create federated room | Room created locally |
| **Room - Create DM** | `createDirectMessageRoom()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:259` | Create direct message room | DM created locally |
| **Room - Update Name** | `updateRoomName()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:743` | Change room name | Room name changed locally |
| **Room - Update Role** | `addUserRoleRoomScoped()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:774` | Change user role (power level) | User role changed locally |
| **Room - Update Topic** | `updateRoomTopic()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:759` | Change room topic | Room topic changed locally |
| **User - Ensure Exists** | `ensureFederatedUsersExistLocally()` | `ee/packages/federation-matrix/src/FederationMatrix.ts:236` | Create federated user locally | Before DM/room creation with external users |

## Callback Hooks (Trigger Points for Outgoing Operations)

| Callback | Location | Triggers |
| --- | --- | --- |
| `federation.afterCreateFederatedRoom` | `apps/meteor/ee/server/hooks/federation/index.ts:21` | `createRoom()`, `inviteUsersToRoom()` |
| `afterSaveMessage` | `apps/meteor/ee/server/hooks/federation/index.ts:53` | `sendMessage()` |
| `afterSaveMessage` (edit) | `apps/meteor/ee/server/hooks/federation/index.ts:214` | `updateMessage()` |
| `afterDeleteMessage` | `apps/meteor/ee/server/hooks/federation/index.ts:76` | `deleteMessage()` |
| `beforeAddUsersToRoom` | `apps/meteor/ee/server/hooks/federation/index.ts:91` | `ensureFederatedUsersExistLocally()` |
| `beforeAddUserToRoom` | `apps/meteor/ee/server/hooks/federation/index.ts:105` | `inviteUsersToRoom()` |
| `afterSetReaction` | `apps/meteor/ee/server/hooks/federation/index.ts:142` | `sendReaction()` |
| `afterUnsetReaction` | `apps/meteor/ee/server/hooks/federation/index.ts:157` | `removeReaction()` |
| `afterLeaveRoomCallback` | `apps/meteor/ee/server/hooks/federation/index.ts:172` | `leaveRoom()` |
| `afterRemoveFromRoomCallback` | `apps/meteor/ee/server/hooks/federation/index.ts:182` | `kickUser()` |
| `afterRoomNameChange` | `apps/meteor/ee/server/hooks/federation/index.ts:192` | `updateRoomName()` |
| `afterRoomTopicChange` | `apps/meteor/ee/server/hooks/federation/index.ts:203` | `updateRoomTopic()` |
| `beforeChangeRoomRole` | `apps/meteor/ee/server/hooks/federation/index.ts:229` | `addUserRoleRoomScoped()` |
| `beforeCreateDirectRoom` | `apps/meteor/ee/server/hooks/federation/index.ts:239` | `ensureFederatedUsersExistLocally()` |
| `afterCreateDirectRoom` | `apps/meteor/ee/server/hooks/federation/index.ts:264` | `createDirectMessageRoom()` |
| `presence.status` (event) | `ee/packages/federation-matrix/src/FederationMatrix.ts:164` | `sendPresenceUpdateToRooms()` |

## Summary Statistics

- **Total Incoming Operations**: 19 (18 event handlers + 1 invite endpoint)
- **Total Outgoing Operations**: 22 (service methods)
- **Entry Point for Incoming**: `PUT /_matrix/federation/v1/send/:txnId` (`ee/packages/federation-matrix/src/api/_matrix/transactions.ts:323`)
- **Entry Point for Outgoing**: Callback hooks in `apps/meteor/ee/server/hooks/federation/index.ts`
- **Event Registration**: `ee/packages/federation-matrix/src/events/index.ts`

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INCOMING FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Remote Matrix Server                                                        │
│         │                                                                    │
│         ▼                                                                    │
│  PUT /_matrix/federation/v1/send/:txnId                                     │
│  (transactions.ts:323)                                                       │
│         │                                                                    │
│         ▼                                                                    │
│  federationSDK.processIncomingTransaction()                                 │
│         │                                                                    │
│         ▼                                                                    │
│  Event Emitter Service                                                       │
│         │                                                                    │
│         ├──► homeserver.matrix.message    ──► message.ts                    │
│         ├──► homeserver.matrix.membership ──► member.ts                     │
│         ├──► homeserver.matrix.reaction   ──► reaction.ts                   │
│         ├──► homeserver.matrix.redaction  ──► reaction.ts / message.ts      │
│         ├──► homeserver.matrix.room.*     ──► room.ts                       │
│         ├──► homeserver.matrix.typing     ──► edu.ts                        │
│         ├──► homeserver.matrix.presence   ──► edu.ts                        │
│         └──► homeserver.matrix.encrypted  ──► message.ts                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          OUTGOING FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Rocket.Chat Core Action                                                     │
│         │                                                                    │
│         ▼                                                                    │
│  Callback Hooks (apps/meteor/ee/server/hooks/federation/index.ts)           │
│         │                                                                    │
│         ├──► afterSaveMessage        ──► FederationMatrix.sendMessage()     │
│         ├──► afterDeleteMessage      ──► FederationMatrix.deleteMessage()   │
│         ├──► afterSetReaction        ──► FederationMatrix.sendReaction()    │
│         ├──► afterUnsetReaction      ──► FederationMatrix.removeReaction()  │
│         ├──► beforeAddUserToRoom     ──► FederationMatrix.inviteUsersToRoom()│
│         ├──► afterLeaveRoomCallback  ──► FederationMatrix.leaveRoom()       │
│         ├──► afterRemoveFromRoom     ──► FederationMatrix.kickUser()        │
│         ├──► afterRoomNameChange     ──► FederationMatrix.updateRoomName()  │
│         ├──► afterRoomTopicChange    ──► FederationMatrix.updateRoomTopic() │
│         └──► beforeChangeRoomRole    ──► FederationMatrix.addUserRoleRoomScoped()│
│                                                                              │
│         ▼                                                                    │
│  FederationMatrix Service (FederationMatrix.ts)                             │
│         │                                                                    │
│         ▼                                                                    │
│  federationSDK.* methods                                                     │
│         │                                                                    │
│         ▼                                                                    │
│  Remote Matrix Server                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
| --- | --- |
| `ee/packages/federation-matrix/src/FederationMatrix.ts` | Main service class with all outgoing operation methods |
| `ee/packages/federation-matrix/src/events/index.ts` | Registers all incoming event handlers |
| `ee/packages/federation-matrix/src/events/message.ts` | Handles incoming messages, edits, media, encrypted, redactions |
| `ee/packages/federation-matrix/src/events/member.ts` | Handles membership events (invite, join, leave) |
| `ee/packages/federation-matrix/src/events/reaction.ts` | Handles reactions and reaction redactions |
| `ee/packages/federation-matrix/src/events/room.ts` | Handles room state changes (name, topic, roles) |
| `ee/packages/federation-matrix/src/events/edu.ts` | Handles ephemeral data (typing, presence) |
| `ee/packages/federation-matrix/src/api/_matrix/transactions.ts` | Main transaction endpoint for incoming PDUs/EDUs |
| `ee/packages/federation-matrix/src/api/_matrix/invite.ts` | Invite processing endpoint |
| `apps/meteor/ee/server/hooks/federation/index.ts` | All callback hooks connecting RC core to federation |

