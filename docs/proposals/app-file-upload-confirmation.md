# Proposal: App-requested user confirmation for file uploads

## Status

Draft

> **Depends on** [A unified `EventResult` return type for apps-engine pre-events](./apps-engine-event-result-return-type.md).
> The confirmation hook below returns that proposal's `EventResult` type; requesting
> confirmation is the `EventResult.prompt` variant. This proposal is the first
> consumer of `EventResult` and its `prompt` variant, not a parallel mechanism.

## Summary

Rocket.Chat already has a well-established pattern for **interrupting an HTTP/DDP
request to obtain something extra from the user and then resuming it**: the
Two-Factor Authentication (TOTP) challenge. The server refuses the request with
a typed error that describes what it needs, the client renders a UI, collects
the missing input, and **re-sends the identical request** with the input
attached. No long-lived server-side "challenge session" is kept.

This proposal describes how to reuse that same challenge/response shape to let
**Apps** (Apps-Engine) request explicit user confirmation before a file upload
is finalized. Today an app can only *silently block* an upload via
`IPreFileUpload`; it cannot say "ask the user to confirm, and proceed only if
they accept." We introduce an `upload-confirmation-required` challenge that
mirrors `totp-required` end to end.

---

## Background: how the TOTP challenge works today

The mechanism we want to imitate has four moving parts.

### 1. A stateless server-side gate that throws a typed challenge

`checkCodeForUser` (`apps/meteor/server/lib/2fa/code/index.ts:191`) is the single
enforcement point. When a protected operation is reached and no valid proof is
present, it throws a `Meteor.Error` whose `details` describe the challenge
(`index.ts:232`):

```js
throw new Meteor.Error('totp-required', 'TOTP Required', {
    method: selectedMethod.name,   // 'totp' | 'email' | 'password'
    ...data,                       // codeGenerated, codeExpires, emailOrUsername
    availableMethods,
});
```

Invalid / exhausted attempts throw `totp-invalid` and `totp-max-attempts`
(`index.ts:244`, `index.ts:251`). The server keeps **no** challenge session — the
error itself is the entire contract.

### 2. Two transports for attaching the proof to a re-sent request

- **REST**: headers `x-2fa-code` and `x-2fa-method`, read back inside
  `checkCodeForUser` (`index.ts:211`) and by the REST middleware
  `APIClass.processTwoFactor` (`apps/meteor/server/api/ApiClass.ts:513`).
- **DDP methods**: a trailing `{ twoFactorCode, twoFactorMethod }` argument,
  popped by the `twoFactorRequired` wrapper
  (`apps/meteor/server/lib/2fa/twoFactorRequired.ts:29`).

### 3. A declarative way for an endpoint/method to opt in

- REST routes set `twoFactorRequired: true` (+ optional `twoFactorOptions`) in
  their options object (`apps/meteor/server/api/definition.ts:133`). The
  lifecycle calls `processTwoFactor` right after param validation and before the
  action runs (`ApiClass.ts:874`).
- DDP methods wrap their handler with `twoFactorRequired(fn, options)`.

### 4. A client interceptor that renders UI and re-sends

- **REST** (`packages/api-client/src/index.ts`): on a 400 whose body is a
  `totp-*` error, the client invokes the registered two-factor handler to obtain
  a code, then **recursively re-sends the same request** with the
  `x-2fa-code`/`x-2fa-method` headers added.
- **DDP** (`apps/meteor/client/lib/2fa/process2faReturn.ts` +
  `client/meteor/overrides/totpOnCall.ts`): `Meteor.call` is overridden; on a
  `totp-*` error it opens `TwoFactorModal` (`process2faReturn.ts:125`), collects
  the code, and re-calls the method with the trailing 2FA argument.

Type guards that recognize the challenge live in
`apps/meteor/client/lib/2fa/utils.ts` and `packages/api-client/src/errors.ts`.

### 5. A "remember" optimization

On success, `rememberAuthorization` (`index.ts:143`) stores a fingerprint
(hash of user-agent + client address) and an expiry on the login token so the
same client isn't re-challenged for every request within a window. This is the
piece that makes a per-request challenge tolerable in practice.

**The essence to carry over:** *typed challenge error → client renders UI →
client re-sends the same request with proof → server re-validates → optional
"remember" to avoid re-prompting.*

---

## Problem

The current file-upload pipeline gives apps exactly one interception point, and
it is **block-only**.

`FileUpload.validateFileUpload` runs the `IPreFileUpload` hook synchronously,
inside the upload request, just before the file is persisted
(`apps/meteor/server/lib/media/file-upload/lib/FileUpload.ts:197`):

```ts
// App IPreFileUpload event hook
try {
    await Apps.self?.triggerEvent(AppEvents.IPreFileUpload, { file, content });
} catch (error: any) {
    if (error.name === AppsEngineException.name) {
        throw new Meteor.Error('error-app-prevented', error.message);
    }
    throw error;
}
```

The hook's contract (`packages/apps-engine/src/definition/uploads/IPreFileUpload.ts`)
is: return `void` to allow, or throw `FileUploadNotAllowedException` to reject.
There is no third option — an app cannot say *"this upload looks sensitive; ask
the user to confirm and let it through only if they accept."*

Concrete use cases this blocks:

- A DLP / compliance app that wants "This file appears to contain credentials —
  send anyway?" with a user decision, not a hard block.
- A cost/quota app: "This 400 MB upload will consume your monthly quota.
  Continue?"
- A moderation app that wants the uploader to acknowledge a policy before the
  file becomes visible in the room.

Apps *can* already open modals via the UIKit interaction stack
(`IUIController.openSurfaceView` → `UiInteractionBridge.notifyUser` →
`api.broadcast('notify.uiInteraction', ...)` in
`apps/meteor/app/apps/server/bridges/uiInteraction.ts:22` → client stream
`useAppUiKitInteraction`), **but that path is fire-and-forget and completely
decoupled from the in-flight upload request.** There is no way to make the
upload wait for, and be gated on, the user's answer. That decoupling is exactly
what the TOTP challenge pattern solves for authentication, and what we want here.

---

## Goals / Non-goals

**Goals**

- Let an app declaratively require user confirmation before a specific upload is
  finalized, and gate the upload on the user's decision.
- Reuse the TOTP challenge/response shape (typed error → client UI → re-send
  with proof) so the behavior, transports, and client plumbing are familiar and
  consistent.
- Support both the interactive client upload flow (`rooms.media` →
  `rooms.mediaConfirm`) and, as a follow-up, app-initiated uploads
  (`IUploadCreator.uploadBuffer`).
- Let the app supply the confirmation UI content (title, message, and optionally
  UIKit blocks) so the prompt is meaningful, not generic.

**Non-goals**

- Replacing or deprecating `IPreFileUpload`'s block-only behavior — it stays for
  hard rejections.
- Building a new real-time surface type. The confirmation prompt is a modal, and
  where possible we reuse the existing UIKit surface renderer.
- Confirmation for avatar / non-room uploads (out of scope for v1).

---

## Proposed solution

### The analogy, mapped

| TOTP concept | Upload-confirmation equivalent |
| --- | --- |
| `checkCodeForUser` gate | `checkUploadConfirmation` gate |
| `totp-required` error | `upload-confirmation-required` error |
| `totp-invalid` / `totp-max-attempts` | `upload-confirmation-invalid` / `upload-confirmation-expired` |
| `details: { method, availableMethods, ... }` | `details: { confirmationId, appId, appName, title, text, blocks? }` |
| Header `x-2fa-code` / `x-2fa-method` | Header `x-upload-confirmation-id` / `x-upload-confirmation-token` |
| DDP trailing `{ twoFactorCode, twoFactorMethod }` | Trailing `{ uploadConfirmationId, uploadConfirmationToken }` |
| Route opt-in `twoFactorRequired: true` | (implicit: any upload route runs the gate) |
| `TwoFactorModal` on the client | `UploadConfirmationModal` (or a rendered UIKit surface) |
| `rememberAuthorization` (fingerprint + expiry) | short-lived signed confirmation token bound to the upload |

### Where the gate lives

The natural insertion point already exists. The interactive client upload is a
**two-step temporary-file flow** (`apps/meteor/server/api/v1/rooms.ts`):

1. `POST rooms.media/:rid` (`rooms.ts:265`) stores the bytes as a *temporary*
   upload with a 24h `expiresAt` (`rooms.ts:283`) — **no message is created
   yet**.
2. `POST rooms.mediaConfirm/:rid/:fileId` (`rooms.ts:325`) calls
   `sendFileMessage` and then `Uploads.confirmTemporaryFile` (`rooms.ts:361`),
   turning the temp upload into a real message.

This maps beautifully onto a confirmation challenge: **the bytes are already
safely staged after step 1, so the challenge belongs on `rooms.mediaConfirm`,
which is the point of no return.** We add the gate there:

```
rooms.mediaConfirm/:rid/:fileId
  ├─ resolve temp file (existing)
  ├─ await checkUploadConfirmation({ userId, file, connection, request })   ← NEW
  │     └─ runs the app confirmation hook; throws upload-confirmation-required
  │        if an app requests confirmation and no valid token is present
  ├─ sendFileMessage(...)            (existing)
  └─ Uploads.confirmTemporaryFile()  (existing)
```

Because the file is already staged, a challenge that is never answered simply
expires with the temporary upload (24h TTL) and is garbage-collected — no
special cleanup is needed, unlike a challenge thrown mid-stream.

### The new server gate: `checkUploadConfirmation`

A small module (e.g. `apps/meteor/server/lib/upload-confirmation/`) mirroring the
`2fa/code` module:

```ts
// pseudo-code, mirrors checkCodeForUser
export async function checkUploadConfirmation({
    userId, file, connection, request, code, // code = { confirmationId, token }
}: ICheckUploadConfirmation): Promise<void> {
    // 1. Read proof from explicit args or headers (mirror of index.ts:211)
    const confirmationId = code?.confirmationId
        ?? request?.headers.get('x-upload-confirmation-id') ?? undefined;
    const token = code?.token
        ?? request?.headers.get('x-upload-confirmation-token') ?? undefined;

    // 2. If we already hold a valid token for this upload, pass.
    if (confirmationId && token && verifyToken(confirmationId, file._id, userId, token)) {
        return; // equivalent to isAuthorizedForToken() returning true
    }

    // 3. Ask apps whether this upload needs confirmation.
    //    The manager short-circuits on the *first* app that returns a
    //    EventResult.prompt, returning that decision (with the requesting appId);
    //    apps that return EventResult.pass are skipped.
    const decision = await Apps.self?.triggerEvent(
        AppEvents.IPreFileUploadConfirmation, { file, content });

    if (!decision || decision.type === 'pass') {
        return; // no app wants confirmation → allow (like no 2FA method → allow)
    }

    // decision.type === 'prompt' here (the only other variant this event allows;
    // a disallowed variant would have been logged + treated as pass by the manager)

    // 4. No valid token yet → issue the challenge (mirror of index.ts:232).
    //    The prompt payload IS the challenge detail.
    const newConfirmationId = issueConfirmation(file._id, userId, decision);
    throw new Meteor.Error('upload-confirmation-required', 'Upload confirmation required', {
        confirmationId: newConfirmationId,
        appId: decision.appId,      // stamped by the manager with the deciding app
        appName: decision.appName,
        title: decision.title,      // @rocket.chat/ui-kit TextObject (PlainText | Markdown)
        text: decision.text,        // @rocket.chat/ui-kit TextObject
        blocks: decision.blocks,    // optional UIKit blocks for a rich prompt
        confirmLabel: decision.confirmLabel,
        cancelLabel: decision.cancelLabel,
    });
}
```

The confirmation **token** is a short-lived signed value bound to
`(confirmationId, fileId, userId)` — analogous to the fingerprint hash TOTP
stores, but scoped to a single upload rather than a time window. It is minted by
the confirmation-response endpoint (below) once the user accepts, so a client
cannot fabricate acceptance by simply re-sending with an arbitrary header.

### App-facing API: a new interactive hook

`IPreFileUpload` stays block-only. We add a sibling hook that returns a
`EventResult` (from the unified-`EventResult` proposal), restricted to the
`pass | prompt` subset — `EventResult.prompt(...)` *requests* confirmation instead
of throwing, `EventResult.pass()` allows:

```ts
// packages/apps-engine/src/definition/uploads/IPreFileUploadConfirmation.ts
export interface IPreFileUploadConfirmation {
    [AppMethod.EXECUTE_PRE_FILE_UPLOAD_CONFIRMATION](
        context: IFileUploadContext,   // { file, content } — already exists
        read: IRead,
        http: IHttp,
        persis: IPersistence,
        modify: IModify,
    ): Promise<UploadConfirmationEventResult>;
    //   EventResult.pass()        → no confirmation needed, allow
    //   EventResult.prompt({…})   → prompt the user with this content before finalizing
}

// Restricted per-event union (see the EventResult proposal's capability matrix):
//   type UploadConfirmationEventResult = PassEventResult | PromptEventResult;
```

The confirmation UI is carried by the `prompt` variant's **rich** payload —
which is exactly the shape this proposal previously called
`IUploadConfirmationRequest`:

```ts
EventResult.prompt({
    title?: TextObject;      // @rocket.chat/ui-kit TextObject: PlainText | Markdown
    text?: TextObject;
    blocks?: Block[];        // optional UIKit blocks, rendered in the modal
    confirmLabel?: string;   // default "Send"
    cancelLabel?: string;    // default "Cancel"
});
```

(The `prompt` variant also has a simple `{ message }` / `{ i18n: { key, args? } }`
form for prompts that don't need a title or custom labels. Both forms support
i18n: the simple form via the explicit `i18n` channel, and the rich form because
ui-kit `TextObject` text is resolved through the app-translation-aware renderer at
render time.)

This reuses the existing `IFileUploadContext` (`{ file, content }`,
`packages/apps-engine/src/definition/uploads/IFileUploadContext.ts`) and the
existing listener-dispatch machinery in
`apps/meteor/app/apps/server/bridges/listeners.ts` (the `IPreFileUpload` case at
`listeners.ts:284` is the template). Rejection is still available via the old
block-only hook (which is where upload's `prevent` lives, at the `rooms.media`
pre-stage); the new hook is strictly additive and carries only `pass`/`prompt`.

### Client handling (mirror of `process2faReturn`)

Add a `process-upload-confirmation` interceptor analogous to
`apps/meteor/client/lib/2fa/process2faReturn.ts`:

1. The upload flow (`apps/meteor/client/lib/chats/flows/processMessageUploads.ts`
   / `client/lib/chats/uploads.ts`) calls `rooms.mediaConfirm`.
2. If the response is `upload-confirmation-required`, a type guard (mirror of
   `isTotpRequiredError` in `client/lib/2fa/utils.ts`) recognizes it.
3. The client opens an `UploadConfirmationModal`. If `details.blocks` is present,
   it is rendered through the existing UIKit surface renderer used by
   `useAppUiKitInteraction`; otherwise a generic title/text/accept/reject dialog
   is shown.
4. On **accept**, the client POSTs the user's decision to a small response
   endpoint `POST rooms.mediaConfirmation/:confirmationId` (accept/reject),
   which mints the signed token, then **re-sends** the original
   `rooms.mediaConfirm` request with the
   `x-upload-confirmation-id` / `x-upload-confirmation-token` headers attached —
   exactly as the api-client re-sends with `x-2fa-*` today.
5. On **reject** (or modal close), the temp upload is left to expire; optionally
   the client calls `rooms.mediaDelete` to clean up eagerly.

For REST clients that use `@rocket.chat/api-client`, the same recursive re-send
that handles `totp-*` (`packages/api-client/src/index.ts`) can be extended with
an `uploadConfirmationHandler`, so third-party/bot clients get the behavior for
free.

### App-initiated uploads (follow-up)

App uploads (`IUploadCreator.uploadBuffer` →
`AppUploadBridge.createUpload`, `apps/meteor/app/apps/server/bridges/uploads.ts:45`)
currently go straight from `fileStore.insert` to `sendFileMessage` with no gate.
To bring them under the same model we would:

- stage the app upload as a temporary file (set `expiresAt`, skip the immediate
  `sendFileMessage`), then
- open the confirmation modal to the target user via the existing
  `IUIController.openSurfaceView` path, and
- finalize with `sendFileMessage` + `confirmTemporaryFile` on accept.

This is a larger change (the app path is currently synchronous and returns the
`IUpload` immediately), so it is proposed as a **phase 2**. Phase 1 covers the
human-initiated upload, which is where "app asks the uploader to confirm" is most
valuable.

---

## End-to-end flow (phase 1)

```
User picks a file in a room
      │
      ▼
POST rooms.media/:rid                     → 200 { file:{ _id, url } }   (temp, 24h TTL)
      │
      ▼
POST rooms.mediaConfirm/:rid/:fileId
      │
      ├─ checkUploadConfirmation()
      │     └─ IPreFileUploadConfirmation hook → app returns EventResult.prompt({ title, text, blocks })
      │
      └─ throws 400 upload-confirmation-required
             { confirmationId, appId, appName, title, text, blocks }
      │
      ▼
Client recognizes the challenge, opens UploadConfirmationModal
      │
      ├─ user REJECTS → temp file expires / eager delete → done
      │
      └─ user ACCEPTS
             │
             ▼
      POST rooms.mediaConfirmation/:confirmationId  { decision: 'accept' }
             → 200 { token }               (signed, bound to fileId+userId)
             │
             ▼
      POST rooms.mediaConfirm/:rid/:fileId
        headers: x-upload-confirmation-id, x-upload-confirmation-token
             │
             ├─ checkUploadConfirmation() → token valid → passes
             ├─ sendFileMessage(...)
             └─ Uploads.confirmTemporaryFile(...)
             → 200 { message }
```

---

## Security considerations

- **Confirmation token integrity.** The token must be server-minted, signed, and
  bound to `(confirmationId, fileId, userId)` with a short TTL (e.g. minutes).
  This is the analog of TOTP's fingerprint/expiry (`index.ts:114`) and prevents a
  client from asserting acceptance by inventing a header value. The decision
  must be recorded server-side by the response endpoint, not trusted from the
  re-sent request alone.
- **The bytes are already staged before the challenge.** Because the challenge
  sits on `rooms.mediaConfirm`, the file exists as a temporary upload during the
  prompt. This is acceptable (it already happens for every upload today) and
  avoids re-streaming, but it means `IPreFileUpload`'s hard-block checks
  (content-type, size, E2EE, app rejection) must still run on `rooms.media`
  *before* the file is staged — confirmation is about intent, not validation.
- **App abuse / prompt fatigue.** Gate the new hook behind an app permission
  (mirroring `AppPermissions.ui.interaction` used by the UI bridge) and consider
  a per-app/per-room rate limit so an app cannot spam confirmation prompts.
- **Untrusted prompt content.** `title`/`text`/`blocks` come from an app and are
  rendered to the user. They must be treated as untrusted and sanitized/escaped
  exactly as other app-supplied UIKit content is.
- **Multiple apps.** If several apps request confirmation, v1 challenges for the
  first and re-runs the gate on re-send (chaining), the same way TOTP resolves a
  single method per round-trip. This keeps the per-request contract simple.

---

## Backward compatibility

- `IPreFileUpload` is untouched; existing apps keep working.
- Uploads for which no app implements `IPreFileUploadConfirmation` hit the gate,
  find no requester, and pass through unchanged — identical to a user with no
  2FA method configured passing `checkCodeForUser`.
- Older clients that don't understand `upload-confirmation-required` will surface
  it as an upload error rather than a prompt. To avoid a hard failure, the gate
  can be feature-flagged and/or the client can advertise support via a header
  (e.g. `x-upload-confirmation-supported`), with the server skipping the
  challenge for clients that don't advertise it — a graceful-degradation lever
  that TOTP does not need but uploads should have.

---

## Alternatives considered

1. **Reuse the fire-and-forget UIKit modal only.** Apps can already
   `openSurfaceView`. But that modal is not correlated with the in-flight upload
   request (`uiInteraction.ts:22` just broadcasts), so the upload cannot be gated
   on the answer. Rejected as the sole mechanism; reused as the *rendering* layer.
2. **Make `IPreFileUpload` itself interactive.** Its contract is synchronous
   allow/deny-by-throw and it runs mid-stream on `rooms.media` before the file is
   even staged. Blocking it on a user round-trip would hold an open request and a
   half-streamed file. Rejected in favor of a new hook on the already-staged
   `rooms.mediaConfirm` step.
3. **A brand-new challenge transport.** Rejected — the whole point is to reuse
   the proven `x-2fa-*` header / trailing-arg / typed-error shape so the client
   and third-party clients need minimal new plumbing.

---

## Open questions

- Should the confirmation decision (accept/reject) be recorded/audited, e.g. for
  DLP compliance apps that need proof the user acknowledged a warning?
- Should apps be able to *update* the pending prompt (mirror of
  `updateSurfaceView`) or is a single-shot prompt sufficient for v1?
- Do we want a "remember for this room/session" affordance (closer to TOTP's
  remember-me), or is per-upload confirmation always the right granularity?
- Phase 2 (app-initiated `uploadBuffer` uploads): is opening a modal to a user
  who did not initiate the action acceptable UX, or should those uploads use a
  different acknowledgement surface (e.g. an action button on the resulting
  message)?

---

## Affected code (reference index)

- Gate template: `apps/meteor/server/lib/2fa/code/index.ts`,
  `apps/meteor/server/lib/2fa/twoFactorRequired.ts`
- REST challenge plumbing: `apps/meteor/server/api/ApiClass.ts:513`,
  `apps/meteor/server/api/definition.ts:94`
- Upload routes to modify: `apps/meteor/server/api/v1/rooms.ts:265` (`rooms.media`),
  `apps/meteor/server/api/v1/rooms.ts:325` (`rooms.mediaConfirm`)
- Existing app hook: `packages/apps-engine/src/definition/uploads/IPreFileUpload.ts`,
  `apps/meteor/server/lib/media/file-upload/lib/FileUpload.ts:197`,
  `apps/meteor/app/apps/server/bridges/listeners.ts:284`
- App upload path (phase 2): `apps/meteor/app/apps/server/bridges/uploads.ts:45`,
  `packages/apps-engine/src/definition/accessors/IUploadCreator.ts:11`
- UIKit rendering to reuse: `apps/meteor/app/apps/server/bridges/uiInteraction.ts`,
  `apps/meteor/client/hooks/useAppUiKitInteraction.ts`,
  `packages/apps-engine/src/definition/accessors/IUIController.ts:28`
- Client challenge template: `apps/meteor/client/lib/2fa/process2faReturn.ts`,
  `apps/meteor/client/lib/2fa/utils.ts`, `packages/api-client/src/index.ts`
</content>
