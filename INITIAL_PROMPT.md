/grill-me I want to work on a v2 SDK for @packages/apps and @packages/apps-engine - a full rewrite for a better architecture. This is a humongos effort that I do not expect to finish in one session, but I need help structuring the context/spec document and making sure I cover important architectural decisions.

My main concerns that I want to address in the new version are:

- API is too bureaucratic - apps _have_ to implement a class; reading data goes through `read.get[Entity]Reader().getById`, which is passed as an argument to several methods; changing data requires a call to `modify.getCreator().start[Entity]()`, which returns a builder class for said entity, and then `modify.getCreator().finish(builder)` that will then act on the data; each entity (messages, rooms, users, etc.) has a different set of properties from the core entities, which requires us to maintain a conversion class and prevents natural parity with the evolving core types; many events have prefixes to denote when they'll happen (e.g. IPreMessageSent), a suffix denoting "context" (e.g. IPreMessageSentPrevent, IPreMessageSentExtend) and have 2 methods exposed (e.g. checkPreMessageSentPrevent and executePreMessageSentPrevent).

- Reading data from the host offers little flexibility - current types, like IMessage and IRoom, imply a relationship resolution when acting on them - IMessage has a `sender` property of type `IUser`, which means that the server has to resolve the user lookup before returning to the app. This makes all data fetching much more costly, especially on event handling. This also prevents us from offering many methods that read a list of entities, as that would be simply too costly.

- Permission handling is insufficient - when an app lacks the permission to execute a method call, an error is logged to the server console, but an exception is not thrown, which means the app has no way of knowing at runtime that it has hit a permission problem.

- Difficulty on keeping some kind of parity with HTTP endpoint APIs offered by the server - all of the points above cause extending the existing API very laborious, which causes the apps-engine APIs to offer much less functionality than the one accessible via HTTP endpoints.

- API is not idiomatic to JS/TS - this causes friction in situations where a proficient JS/TS developer wants to write apps.

- Difficult troubleshooting experience - some logs are saved in the database, some are sent to the server console, a lot of times it is hard to know where to look and sometimes the information is not even available.

- App installation and lifecycle management is too complex - there are too many steps included in taking an app from installed to enabled, and this path is not clearly mapped.

- The AppManager class has too many responsibilities - speaks for itself, it's hard to reason when something should be done in the AppManager or not.

- Types are not ergonomic - Most types offer several optional properties, failing to map invariants.

Some ideas I'd like to follow for the new version:

- We need to keep both new apps and old apps coexisting before we can completely drop the deprecated version.

- We need to use a proper IoC container to improve solidity and ergonomics.

- We should use types from @packages/core-typings instead of our own.

- We should use the Repository pattern to interact with system entities (messages, rooms, users). We need a way to deal with paging so apps can request bulks of data (cursor based, maybe?)

- We should focus on executing apps in a local runtime now, but plan the API around allowing network access as well.

- Apps have two possible desired states: enabled or disabled. The local runtime is responsible for keeping the running state of the app aligned with the target state.

