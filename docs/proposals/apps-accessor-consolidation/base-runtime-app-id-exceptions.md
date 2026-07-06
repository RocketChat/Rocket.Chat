# APP_ID normalization — exception list (Phase 0 artifact)

This is the audited companion to §5.2 of `base-runtime-accessor-consolidation.md`.

## The rule and why exceptions matter

When an accessor running in the subprocess sends a `bridges:<bridge>:do*` message, any **top-level
positional param** whose value is the literal string `'APP_ID'` is rewritten host-side to the app's
real id before the bridge method runs:

```ts
// BaseRuntimeSubprocessController.handleBridgeMessage
params.map((value) => (value === 'APP_ID' ? this.appPackage.info.id : value))
```

So the default for any param that denotes **the calling app's identity** is the sentinel `'APP_ID'`
— it makes impersonation structurally impossible (the sandbox never chooses the id).

But this is a *per-param judgment* that fails in **both** directions, and neither failure is caught
by the type-checker or a green test:

- **Over-normalizing** a genuine app-supplied argument-appId → the app can now only ever act as
  itself; a silent capability regression.
- **Under-normalizing** a caller-identity param → re-opens the impersonation gap.

Therefore every `do*` appId param falls into exactly one of three buckets. Only bucket A is
normalized to `'APP_ID'`; B and C must **not** be.

---

## Bucket A — caller-identity, top-level positional → normalize to `'APP_ID'`

These are the appId trailing args the host substitution was designed for. Everything refactored in
Phase 0 that isn't listed in B/C below is in this bucket:

| Accessor | Bridge calls normalized |
| --- | --- |
| `Notifier` | `getMessageBridge:doNotifyUser` `[user, message, 'APP_ID']`, `:doNotifyRoom` `[room, message, 'APP_ID']`, `:doTyping` `[{…}, 'APP_ID']`; `getUserBridge:doGetAppUser` `['APP_ID']` |
| `ModifyCreator` | `getUserBridge:doGetAppUser` `['APP_ID']` (already correct); `getMessageBridge:doCreate`, `getLivechatBridge:doCreateMessage`, `getRoomBridge:doCreate`, `getRoomBridge:doCreateDiscussion`, `getVideoConferenceBridge:doCreate`, `getUserBridge:doCreate` — all with `'APP_ID'` as the trailing param |
| `ModifyUpdater` | `getMessageBridge:doGetById`/`:doUpdate`, `getRoomBridge:doGetById`/`:doUpdate` — trailing `'APP_ID'` |
| `ModifyExtender` | `getMessageBridge:doGetById`/`:doUpdate`, `getRoomBridge:doGetById`/`:doUpdate`, `getVideoConferenceBridge:doGetById`/`:doUpdate` — trailing `'APP_ID'` |

Before Phase 0 these sent the raw `AppObjectRegistry.get('id')` in every spot except
`ModifyCreator._finishMessage`'s `doGetAppUser` (which already used the sentinel — the lone correct
site, and the drift #7 that motivated this normalization). The observable host behavior is unchanged
(the host still ends up with the real id); the wire now carries the sentinel and the impersonation
gap is closed.

---

## Bucket B — app-supplied argument-appId → keep RAW (must not normalize)

Here the appId is a **method argument the app legitimately provides**, not the caller's identity.
Normalizing it would strip a real capability.

| Bridge method | Signature | Why raw |
| --- | --- | --- |
| `ModerationBridge.doReport` | `(messageId, description, userId, appId)` | `ModerationModify` ignores its constructor `_appId` and forwards the app-supplied method-arg appId. |
| `ModerationBridge.doDismissReportsByMessageId` | `(messageId, reason, action, appId)` | same |
| `ModerationBridge.doDismissReportsByUserId` | `(userId, reason, action, appId)` | same |
| `UserBridge.doDeleteUsersCreatedByApp` | `(appId, type)` | Id is the target app that created bot users |
| `UserBridge.doGetAppUser` | `(appId?)` | Legacy parameter, can't remove due to breaking change risk |

`ModerationModify` is a Phase 2 port, not touched in Phase 0 — but it is the canonical seed of this
bucket, and the faithful port keeps the appId argument passed by the caller verbatim (per §5.1, the
`RemoteBridges` facade does **not** auto-inject `'APP_ID'`, so "keep the caller's arg" is the natural
default and requires no special-casing).

**Audit-when-porting:** any `do*` whose appId is populated from a method parameter rather than
`AppObjectRegistry.get('id')` / `this.appId` belongs here.

---

## Bucket C — nested identity appId → keep RESOLVED id (sentinel can't reach it)

The host substitution maps **only top-level positional params** (`params.map(...)`). It does **not**
recurse into object fields. So an appId carried *inside* a payload object cannot be expressed as the
sentinel — `'APP_ID'` would travel through unrewritten and the bridge would receive the literal
string.

| Accessor | Bridge call | Param shape |
| --- | --- | --- |
| `Http` | `getHttpBridge:doCall` | single positional payload `{ appId, method, url, request }` — `appId` is a **field**, not the param |

`Http` therefore keeps `appId: AppObjectRegistry.get('id')` (the resolved id) after the Phase 0
refactor. This is the one Phase-0 accessor whose identity value is *not* normalized.

**Known limitation (documented, not fixed here):** because `Http` sends the resolved id from inside
the sandbox and the host does not re-derive it for `doCall`, this is a pre-existing impersonation
surface that predates this migration — Phase 0 introduces no new exposure. Closing it needs a
host-side change (either the host substitutes nested `appId` fields for known payload params, or
`HttpBridge.doCall` ignores the payload `appId` and uses the connection-known id). Tracked under
follow-up #6 (consolidated host↔subprocess protocol/SDK); the fix is out of scope for the mechanical
port.
