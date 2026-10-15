# Reconfiguration restarts the listener only when a listener setting changed

- **Status:** accepted
- **Date:** 2026-08
- **Scope:** `src/service/XMPPServerService.ts` (`reconfigure`, `applyConfiguration`, `fingerprintOf`)

## Decision

- The service reads the `XMPP_Server_*` settings and the license on start and again on every
  `watch.settings` event for one of those keys and every `license.module` event for
  `federation`. Reconfigurations are serialized: a burst of setting changes runs one
  `applyConfiguration` at a time.
- When the feature is disabled, unlicensed or has no domain, the server is stopped.
- A fingerprint of the listener-affecting settings (domain, port, MUC subdomain, certificate,
  key) decides between a restart and a soft update. A running server with an unchanged
  fingerprint only has its soft settings refreshed; otherwise it is stopped and started again,
  and MUC state is rebuilt.

## Why

Saving a settings page fires one event per changed key. Without serialization two overlapping
starts would race for the port; without the fingerprint every event would restart the
listener and drop every S2S session for a change the listener does not care about.

### Alternatives rejected

- **Restart on every change.** Simple, but a presence toggle would disconnect every peer.
- **Debounce the events.** Hides the race rather than removing it, and picks an arbitrary
  delay.

## Consequences

- Soft updates today refresh only the presence flag. The allow list is a core config value,
  so a change to it does not reach the running server until a restart
  ([configuration-and-lifecycle D1](../specs/configuration-and-lifecycle.md#d1-allow-list-changes-need-a-service-restart)).
  Fixing that means either adding the allow list to the fingerprint or giving the core a way
  to update it live.
- A restart drops every S2S session; peers reconnect with backoff on their side.
