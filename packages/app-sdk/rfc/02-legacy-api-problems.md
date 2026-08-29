# What's wrong with the legacy app-facing API

> Part of the [Apps Engine SDK RFC](README.md).

From a full inventory of `apps-engine/src/definition` (the entire public
surface). None of these are bugs — they are the cost of a design that predates
modern TypeScript ergonomics.

1. **A god-class you subclass.** Every app `extends App` and registers
   capabilities imperatively inside `extendConfiguration(configuration, env)`
   (`configuration.slashCommands.provideSlashCommand(...)`,
   `configuration.scheduler.registerProcessors(...)`). State lives on `this`.

2. **String-dispatched behavior with no type link.** Event handling is a matrix
   of one-method interfaces (`IPostMessageSent`, `IPreMessageSentModify`,
   `IPreMessageSentPrevent`, …) that you both list in `implements[]` **and**
   implement as methods named by convention (`executePreMessageSentModify`).
   Nothing checks that `implements[]` matches the methods you wrote.

3. **Positional accessor tuples.** Every handler is called as
   `(context, read, http, persistence, modify)`. Five parameters, order-sensitive,
   repeated on every method and lifecycle hook.

4. **A deep read/write accessor tree with start/finish builders.** Reads:
   `read.getRoomReader().getById(id)`. Writes: `modify.getCreator().startMessage()
   .setRoom(r).setText('hi')` then `modify.getCreator().finish(builder)`. Two
   sub-trees (`IRead` vs `IModify`) per domain, and mutation is a build-then-finish
   ceremony.

5. **No schemas.** Slash-command arguments are `string[]` you parse by hand.
   Settings read back as `any`. Persistence is an untyped bag keyed by
   "associations". API request bodies are `any`.

6. **Pre-event intent is split three ways.** For one message event you may need
   `…Prevent` (block), `…Extend` (add), and `…Modify` (rewrite) as three separate
   classes.

7. **Interaction handling is disconnected callbacks.** You `openModalView(view,
   context, user)` in one place and correlate the result in far-away
   `executeViewSubmitHandler` / `executeBlockActionHandler` / `executeViewClosedHandler`
   methods keyed by string `viewId`/`actionId`, stashing state in persistence
   between callbacks.

8. **Model types are a parallel universe.** `definition/` re-declares `IMessage`,
   `IRoom`, `IUser`, … separately from the server's own `core-typings`, and they
   drift.

