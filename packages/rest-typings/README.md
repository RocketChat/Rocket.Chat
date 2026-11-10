# `@rocket.chat/rest-typings`

> TypeScript definitions and JSON Schema validators for the Rocket.Chat REST API.

[![npm](https://img.shields.io/npm/v/@rocket.chat/rest-typings?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/rest-typings) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/rest-typings?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/rest-typings)

This package describes Rocket.Chat's REST endpoints as types: for each path and HTTP method, the parameters it accepts and the result it returns. The entity types it refers to (`IUser`, `IRoom`, `IMessage`, ...) come from [`@rocket.chat/core-typings`](https://www.npmjs.com/package/@rocket.chat/core-typings).

It is mostly consumed indirectly. [`@rocket.chat/api-client`](https://www.npmjs.com/package/@rocket.chat/api-client) and [`@rocket.chat/ddp-client`](https://www.npmjs.com/package/@rocket.chat/ddp-client) use it to type their REST calls, and the Rocket.Chat server uses its validators to check incoming requests.

It also ships runtime code: [AJV](https://ajv.js.org/) validators for many endpoints' parameters (`isChatSendMessageProps`, `isLoginProps`, ...), the shared `ajv` and `ajvQuery` instances, and validators for standard error responses.

## Installation

```sh
npm install @rocket.chat/rest-typings
```

The package is published as CommonJS with TypeScript declarations.

Not every endpoint is in this package. Endpoints the server defines with its newer route API declare their types inside the Rocket.Chat server code, by augmenting `Endpoints`, and are not published here.

## Usage

### Typing a REST call

With [`@rocket.chat/api-client`](https://www.npmjs.com/package/@rocket.chat/api-client), the endpoint path picks the parameter and result types:

```ts
import { RestClient } from '@rocket.chat/api-client';

const client = new RestClient({ baseUrl: 'https://open.rocket.chat' });

// params: ChatSendMessage; result: { message: IMessage } (serialized)
const { message } = await client.post('/v1/chat.sendMessage', {
	message: { rid: 'GENERAL', msg: 'Hello' },
});
```

### Typing your own client

The helper types work with any HTTP library:

```ts
import type { OperationParams, OperationResult, PathPattern } from '@rocket.chat/rest-typings';

async function get<TPathPattern extends PathPattern>(
	path: TPathPattern,
	params: OperationParams<'GET', TPathPattern>,
): Promise<OperationResult<'GET', TPathPattern>> {
	const query = new URLSearchParams(params as Record<string, string>);
	const response = await fetch(`https://open.rocket.chat/api${path}?${query}`);
	return response.json();
}

const { user } = await get('/v1/users.info', { username: 'alice' });
```

Results are typed as the server's objects, with `Date` fields. Over JSON those arrive as strings; wrap a result in `Serialized<...>` from `@rocket.chat/core-typings` to type what you actually receive, as `@rocket.chat/api-client` does.

### Validating parameters

Many endpoints come with a compiled AJV validator named `is<Endpoint>Props`. Each one is a type guard and keeps the errors of the last call in `errors`:

```ts
import { isChatSendMessageProps } from '@rocket.chat/rest-typings';

if (!isChatSendMessageProps(body)) {
	throw new Error(JSON.stringify(isChatSendMessageProps.errors));
}

// body is now typed as the endpoint's parameters
```

### Adding endpoint types

`Endpoints` is an interface, so you can add endpoints through declaration merging, for example for an app's custom endpoints or a route your server version has but this package does not:

```ts
import type { PaginatedRequest, PaginatedResult } from '@rocket.chat/rest-typings';

declare module '@rocket.chat/rest-typings' {
	interface Endpoints {
		'/v1/custom.endpoint': {
			GET: (params: PaginatedRequest<{ query: string }>) => PaginatedResult<{ items: string[] }>;
		};
	}
}
```

The new path is then accepted by every client typed with this package.

### Experimental endpoints

Endpoints under `/api/experimental/` are typed by `ExperimentalEndpoints`. They carry no semver promise and may change or disappear in any release.

They are not part of `Endpoints`, and importing `ExperimentalEndpoints` does not add them to it. Clients typed against `Endpoints`, such as `@rocket.chat/api-client` and `@rocket.chat/ddp-client`, keep rejecting these paths. To call one with types, type the call against `ExperimentalEndpoints` yourself:

```ts
import type { ExperimentalEndpoints } from '@rocket.chat/rest-typings';

type SetCategory = ExperimentalEndpoints['/experimental/rooms.setCategory']['POST'];

const setCategory = async (params: Parameters<SetCategory>[0]): Promise<ReturnType<SetCategory>> => {
	const response = await fetch(`${serverUrl}/api/experimental/rooms.setCategory`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'X-User-Id': userId, 'X-Auth-Token': authToken },
		body: JSON.stringify(params),
	});
	return response.json();
};
```

## API

### Endpoint map

| Export                                   | Description                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `Endpoints`                              | Interface mapping each path pattern (`'/v1/users.info'`) to its methods' signatures. |
| `PathPattern`                            | Every path pattern, with placeholders such as `/v1/rooms.media/:rid`.                |
| `Path`                                   | Every concrete path, with placeholders replaced by `${string}`.                      |
| `Method`                                 | Every HTTP method used by an endpoint.                                               |
| `MethodOf<TPathPattern>`                 | The methods a path pattern supports.                                                 |
| `PathFor<TMethod>`                       | Paths that support a method.                                                         |
| `PathWithParamsFor<TMethod>`             | Paths whose operation takes parameters.                                              |
| `PathWithoutParamsFor<TMethod>`          | Paths whose operation takes no parameters, or optional ones.                         |
| `MatchPathPattern<TPath>`                | The path pattern a concrete path matches.                                            |
| `OperationParams<TMethod, TPathPattern>` | Parameters of an operation.                                                          |
| `OperationResult<TMethod, TPathPattern>` | Result of an operation.                                                              |
| `ParamsFor`, `ResultFor`                 | Same as above, indexed through a per-method map.                                     |
| `UrlParams<T>`                           | The `:placeholder` names in a path pattern, as an object type.                       |
| `JoinPathPattern<TBase, TSub>`           | The path pattern made of a base path and a sub path.                                 |
| `ExperimentalEndpoints`                  | Opt-in typings for `/experimental/...` endpoints.                                    |

Endpoint groups (`ChatEndpoints`, `UsersEndpoints`, `OmnichannelEndpoints`, ...) and the parameter types for each endpoint are exported too.

### Helpers

- `PaginatedRequest<T, S>`: adds `count`, `offset` and `sort` to a parameter type.
- `PaginatedResult<T>`: adds `count`, `offset` and `total` to a result type.
- `WithItemCount`, `ReplacePlaceholders`, `IGetRoomRoles`.

### Validators

- `ajv`: the AJV instance (JSON Schema 2020-12, with `ajv-formats`) used for request bodies.
- `ajvQuery`: the AJV instance used for query strings. It also coerces scalars into arrays (`"c"` becomes `["c"]`).
- `is<Name>Props`, `is<Name>Params`, ...: compiled validators for endpoint parameters.
- `validateBadRequestErrorResponse`, `validateUnauthorizedErrorResponse`, `validateForbiddenErrorResponse`, `validateNotFoundErrorResponse`, `validateInternalErrorResponse`: validators for the standard error responses.

Both instances know the `basic_email` and `rfc_email` formats and the `isNotEmpty` keyword.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/rest-typings). From the repository root:

```sh
yarn workspace @rocket.chat/rest-typings build
yarn workspace @rocket.chat/rest-typings dev
yarn workspace @rocket.chat/rest-typings lint
yarn workspace @rocket.chat/rest-typings typecheck
```

New server endpoints should use the validated route API, which declares their types next to the route. See [docs/api-endpoint-migration.md](https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/api-endpoint-migration.md). For the choice between `ajv` and `ajvQuery`, see [docs/ajv-instances.md](https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/ajv-instances.md).

### Writing typings

- Check that the definition matches the implementation. A wrong definition is worse than none.
- Use the generic `PaginatedRequest` and `PaginatedResult` types for paging.
- Write a validator for the parameters; the server uses it to reject bad requests.
- Test that the validator accepts and rejects what it should.
- Avoid incomplete and `unknown` typings.

### Require one of several parameters

If an endpoint takes a name or an id, and one of them is required, neither is optional. Express that as a union:

```ts
type EndpointTestGetParams = { name?: string; id?: string }; // Wrong

type EndpointTestGetParams = { name: string } | { id: string }; // Better
```

### Validate with a schema, not a hand-written guard

```ts
// Wrong
export const isEndpointTestGetParams = (props: any): props is EndpointTestGetParams => 'name' in props || 'id' in props;

// Better
import { ajvQuery } from './Ajv';

const endpointTestGetParamsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: { name: { type: 'string' } },
			required: ['name'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: { id: { type: 'string' } },
			required: ['id'],
			additionalProperties: false,
		},
	],
};

export const isEndpointTestGetParams = ajvQuery.compile<EndpointTestGetParams>(endpointTestGetParamsSchema);
```

Compile with the shared instances, not a new `Ajv()`: `ajvQuery` for query-string parameters, `ajv` for request bodies.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
