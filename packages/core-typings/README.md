# `@rocket.chat/core-typings`

> TypeScript types for Rocket.Chat's data model: users, rooms, messages, subscriptions, settings, Omnichannel and more.

[![npm](https://img.shields.io/npm/v/@rocket.chat/core-typings?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/core-typings) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/core-typings?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/core-typings)

This package defines the shapes of the records Rocket.Chat stores and sends: `IUser`, `IRoom`, `IMessage`, `ISubscription`, `ISetting`, `ILivechatVisitor`, `IOmnichannelRoom`, and many others. The server, the web client and the other Rocket.Chat packages share these types.

[`@rocket.chat/rest-typings`](https://www.npmjs.com/package/@rocket.chat/rest-typings) and [`@rocket.chat/ddp-client`](https://www.npmjs.com/package/@rocket.chat/ddp-client) build on it to type REST results and realtime events. Use it directly when your code handles Rocket.Chat objects, for example in a bot, an integration or a custom client.

Besides types, it exports a few runtime helpers: type guards such as `isThreadMessage` and `isDirectMessageRoom`, enums such as `UserStatus`, and JSON Schemas generated from the types.

## Installation

```sh
npm install @rocket.chat/core-typings
```

The package is published as CommonJS with TypeScript declarations.

## Usage

### Typing Rocket.Chat objects

```ts
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

const describe = (message: IMessage, room: IRoom, author: IUser) => `${author.username} in ${room.name ?? room._id}: ${message.msg}`;
```

### Typing JSON responses

The types describe objects as the server holds them, with `Date` fields. Objects received over JSON have strings instead. `Serialized<T>` maps a type to its JSON form:

```ts
import type { IMessage, Serialized } from '@rocket.chat/core-typings';

const response = await fetch(`https://open.rocket.chat/api/v1/chat.getMessage?msgId=${messageId}`, { headers });
const { message }: { message: Serialized<IMessage> } = await response.json();

const sentAt = new Date(message.ts); // message.ts is a string here
```

[`@rocket.chat/api-client`](https://www.npmjs.com/package/@rocket.chat/api-client) applies `Serialized` to every result for you.

### Narrowing with type guards

```ts
import { isDirectMessageRoom, isOmnichannelRoom, isThreadMessage } from '@rocket.chat/core-typings';

if (isThreadMessage(message)) {
	console.log('reply in thread', message.tmid);
}

if (isOmnichannelRoom(room)) {
	console.log('visitor', room.v.username);
} else if (isDirectMessageRoom(room)) {
	console.log('direct message with', room.usernames);
}
```

### Comparing enum values

```ts
import { UserStatus } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';

const isAvailable = (user: IUser) => user.status === UserStatus.ONLINE;
```

## API

The package re-exports a large number of types. The main groups are:

| Area        | Examples                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Users       | `IUser`, `IRole`, `IPermission`, `UserStatus`, `IUserSession`, `IPersonalAccessToken`                                          |
| Rooms       | `IRoom`, `IDirectMessageRoom`, `IOmnichannelRoom`, `ITeam`, `ISubscription`, `RoomType`                                        |
| Messages    | `IMessage`, `IThreadMessage`, `IEditedMessage`, `MessageAttachment`, `IUpload`, `IReadReceipt`                                 |
| Omnichannel | `ILivechatVisitor`, `ILivechatAgent`, `ILivechatDepartment`, `ILivechatInquiryRecord`, `ILivechatContact`, `ILivechatPriority` |
| Server      | `ISetting`, `IStats`, `IServerInfo`, `IIntegration`, `ICustomSound`, `IEmojiCustom`, `IBanner`                                 |
| Licensing   | `ILicenseV3`, `LicenseInfo`, `LicenseModule`, and the `Cloud` namespace for cloud sync payloads                                |
| Calls       | `VideoConference`, `IMediaCall`, `CallHistoryItem`                                                                             |

### Utility types

| Export                              | Description                                                  |
| ----------------------------------- | ------------------------------------------------------------ |
| `Serialized<T>`                     | The type of `T` after `JSON.stringify` and `JSON.parse`.     |
| `AtLeast<T, K>`                     | `T` with every property optional except `K`.                 |
| `Optional<T, K>`                    | `T` with the properties `K` made optional.                   |
| `RequiredField<T, K>`               | `T` with the properties `K` made required.                   |
| `DeepPartial<T>`, `DeepWritable<T>` | Recursive `Partial` and recursive removal of `readonly`.     |
| `ValueOf<T>`, `KeyOfEach<T>`        | Union of property values; union of keys across a union type. |
| `UnionToIntersection<T>`            | Turns a union into an intersection.                          |
| `DistributiveOmit<T, K>`            | `Omit` applied to each member of a union.                    |
| `Branded<T, B>`                     | A nominal variant of `T`.                                    |

### Runtime exports

- Type guards for rooms (`isDirectMessageRoom`, `isOmnichannelRoom`, `isTeamRoom`, `isDiscussion`, `isPublicRoom`, `isPrivateRoom`, `isRoomFederated`, ...), messages (`isThreadMessage`, `isThreadMainMessage`, `isSystemMessage`, `isEditedMessage`, `isDeletedMessage`, `isE2EEMessage`, `isDiscussionMessage`, ...) and users (`isOAuthUser`, `isUserFederated`, `isPersonalAccessToken`, ...).
- Enums such as `UserStatus`.
- `getUserDisplayName(name, username, useRealName)` and `normalizeUsername(username)`.
- `isNotUndefined(value)`, a type guard for filtering arrays.
- `schemas`: OpenAPI components with JSON Schemas generated from the main types. The Rocket.Chat server registers them with AJV to validate REST responses and to build its OpenAPI document.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/core-typings). From the repository root:

```sh
yarn workspace @rocket.chat/core-typings build
yarn workspace @rocket.chat/core-typings dev
yarn workspace @rocket.chat/core-typings lint
yarn workspace @rocket.chat/core-typings typecheck
```

`schemas` is generated at compile time by [typia](https://typia.io/). The `build` script patches the TypeScript compiler with `ts-patch` and `typia patch` before compiling, so build with the script rather than plain `tsc`.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
