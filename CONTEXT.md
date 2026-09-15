# Rocket.Chat

Real-time chat platform. The monolith in `apps/meteor` and the EE microservices in `ee/apps` exchange events over a broker and push changes to connected clients over DDP.

## Language

### Streams

**Streamer**:
A named channel that fans server-side events out to the clients subscribed to it, gated by its own read, write and emit rules. One Streamer exists per stream name.
_Avoid_: stream (for the object), channel, topic

**Stream adapter**:
A concrete Streamer bound to one transport. The monolith's adapter publishes through Meteor's DDP server; ddp-streamer's adapter publishes through its own DDP server.
_Avoid_: Stream class, Streamer implementation

**StreamerCentral**:
The per-process registry of every Streamer instance, and the point where a stream event leaves the process for other instances.
_Avoid_: streamer store, streamer registry

**Publication**:
One client's subscription to one Streamer event. It lives until the client unsubscribes or disconnects.
_Avoid_: subscription (ambiguous with the Rocket.Chat room subscription), sub

**Notifications module**:
The catalogue of Streamers the product ships with, together with their access rules.
_Avoid_: notifications service, streams config

**Listeners module**:
The mapping from broker events to Streamer emissions. It is the only place a broker event becomes a client-visible stream event.
_Avoid_: event handlers, event bridge

### DDP Streamer

**DDP Streamer**:
The EE microservice that terminates client websockets and serves Streamers to them without the monolith.
_Avoid_: streamer service, websocket service
