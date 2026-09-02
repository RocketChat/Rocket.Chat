# Test App Packages

Includes pre-built app packages that are designed to test specific APIs exposed by the Apps-engine.

DISCLAIMER: App related source code shown here are for testing purposes only, and don't reflect best practices or recommended implementation.

## How to use

In your tests, add a `before` step and call the `installLocalTestPackage` function, passing the path of your desired package. For instance:

```javascript
import { appImplementsIPreFileUpload } from '../../data/apps/app-packages';
import { installLocalTestPackage } from '../../data/apps/helper';

describe('My tests', () => {
	before(async () => {
		await installLocalTestPackage(appImplementsIPreFileUpload);
	});
});
```

Playwright tests use the equivalent helpers from `tests/e2e/utils/apps.ts` (`installLocalTestPackage`, `uninstallApp`, `getAppLogs`, `findAppLogItem`) instead.

## How to rebuild a package

Every package here is pre-built, and its source is in a `<details>` block below. To change one, copy that
source into a scratch app directory, edit it, and package it again:

```sh
rc-apps package                      # @rocket.chat/apps-cli
cp dist/<app-name>_<version>.zip <path to this folder>
```

Copy the new source back into the `<details>` block, and delete the scratch directory.

Three things to know:

- The scratch dir **must** be inside this repo. `@rocket.chat/apps-engine` is not installed there; it resolves
  upward to the monorepo root `node_modules`, which is a symlink to `packages/apps-engine`. This is what lets
  a fixture typecheck against unreleased engine APIs with no install step.
- `@rocket.chat/apps-engine/*` is left **external** in the bundle (see `external:` in
  `packages/apps/src/server/runtime/base/bundler.ts`), and the Deno runtime maps it back to
  `packages/apps-engine/` (`packages/apps/deno-runtime/deno.jsonc`). So a packaged app runs against the
  *server's* engine, not a frozen copy of it — an app can call engine APIs that did not exist when it was
  packaged, and the zip does not need rebuilding when those APIs change.
- Keep an app to a single class file. `rc-apps package` bundles the whole app into one file anyway, and one
  file is what this document can show.

### Available apps

#### IPreFileUpload handler

File name: `file-upload-test_0.0.1.zip`

An app that handles the `IPreFileUpload` event. If the file name starts with `"test-should-reject"`, the app will prevent the upload from happening. The error message will contain the contents of the uploaded file as evidence that the app could successfully read them.

<details>
<summary>App source code</summary>

```typescript
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { FileUploadNotAllowedException } from '@rocket.chat/apps-engine/definition/exceptions';
import { IPreFileUpload } from '@rocket.chat/apps-engine/definition/uploads';
import { IFileUploadContext } from '@rocket.chat/apps-engine/definition/uploads/IFileUploadContext';

export class TestIPreFileUpload extends App implements IPreFileUpload {
	public async executePreFileUpload(
		context: IFileUploadContext,
		read: IRead,
		http: IHttp,
		persis: IPersistence,
		modify: IModify,
	): Promise<void> {
		if (context.file.name.startsWith('test-should-reject')) {
			console.log('[executePreFileUpload] Rejecting file which name starts with "test-should-reject"');
			throw new FileUploadNotAllowedException(`Test file rejected ${context.content.toString()}`);
		}
		console.log('[executePreFileUpload] Did not reject file');
	}
}
```

</details>

#### API Parameter Test

File name: `api-parameter-test_0.0.1.zip`

An app that provides a public API endpoint with URL parameters. The endpoint path is `/api/:param1/:param2/test` and returns the values of both parameters in the response.

**Response format:**

- Content-Type: `text/plain`
- Body: `Param1: <param1_value>, Param2: <param2_value>`
- Status: 200 OK

<details>
<summary>App source code</summary>

**APIParameterTestApp.ts**

```typescript
import { IAppAccessors, IConfigurationExtend, IEnvironmentRead, ILogger } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { TestEndpoint } from './TestEndpoint';

export class APIParameterTestApp extends App {
	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
		await configuration.api.provideApi({
			visibility: ApiVisibility.PUBLIC,
			security: ApiSecurity.UNSECURE,
			endpoints: [new TestEndpoint(this)],
		});
	}
}
```

**TestEndpoint.ts**

```typescript
import { HttpStatusCode, IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';

export class TestEndpoint extends ApiEndpoint {
	public path = 'api/:param1/:param2/test';

	public async get(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify): Promise<IApiResponse> {
		return {
			content: `Param1: ${request.params.param1}, Param2: ${request.params.param2}`,
			status: HttpStatusCode.OK,
			headers: {
				'Content-Type': 'text/plain',
			},
		};
	}
}
```

</details>

#### External ID Test (resolveVisitor API)

File name: `external-id-test_0.0.1.zip`

An app that tests the `ILivechatCreator.resolveVisitor()` and `ILivechatUpdater.updateVisitorExternalId()` APIs for resolving and updating livechat visitors by external identifiers. This is used to test the WhatsApp BSUID (Business Scoped User ID) support and progressive visitor enrichment.

**Endpoints:**

1. `POST /api/apps/public/:appId/resolve-visitor` - Resolve visitor by externalId with phone/email fallback
2. `POST /api/apps/public/:appId/update-external-id` - Update visitor's externalId for this app

**Request body (resolve-visitor):**
```json
{
  "externalId": { "entityId": "bsuid-123", "metadata": { "username": "@johndoe" } },
  "phone": "+1234567890"
}
```

**Request body (update-external-id):**
```json
{
  "visitorId": "visitor-123",
  "externalId": { "entityId": "bsuid-123", "metadata": { "username": "@johndoe" } }
}
```

**Response:**
- Returns the visitor if found/updated
- Returns `{ visitor: null }` if not found

<details>
<summary>App source code</summary>

**ExternalIdTestApp.ts**
```typescript
import {
	IAppAccessors,
	IConfigurationExtend,
	ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { ResolveVisitorEndpoint } from './ResolveVisitorEndpoint';
import { UpdateExternalIdEndpoint } from './UpdateExternalIdEndpoint';

export class ExternalIdTestApp extends App {
	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	public override async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
		await configuration.api.provideApi({
			visibility: ApiVisibility.PUBLIC,
			security: ApiSecurity.UNSECURE,
			endpoints: [new ResolveVisitorEndpoint(this), new UpdateExternalIdEndpoint(this)],
		});
	}
}
```

**ResolveVisitorEndpoint.ts**
```typescript
import {
	HttpStatusCode,
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';

export class ResolveVisitorEndpoint extends ApiEndpoint {
	public override path = 'resolve-visitor';

	public async post(
		request: IApiRequest,
		_endpoint: IApiEndpointInfo,
		_read: IRead,
		modify: IModify,
		_http: IHttp,
		_persistence: IPersistence,
	): Promise<IApiResponse> {
		const { externalId, phone, email } = request.content;

		let contactData: { phone: string } | { email: string } | undefined;

		if (phone) {
			contactData = { phone };
		} else if (email) {
			contactData = { email };
		}

		const visitor = await modify.getCreator().getLivechatCreator().resolveVisitor(externalId, contactData);

		return {
			status: HttpStatusCode.OK,
			content: { visitor: visitor || null },
		};
	}
}
```

**UpdateExternalIdEndpoint.ts**
```typescript
import {
	HttpStatusCode,
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';

export class UpdateExternalIdEndpoint extends ApiEndpoint {
	public override path = 'update-external-id';

	public async post(
		request: IApiRequest,
		_endpoint: IApiEndpointInfo,
		_read: IRead,
		modify: IModify,
		_http: IHttp,
		_persistence: IPersistence,
	): Promise<IApiResponse> {
		const { visitorId, externalId } = request.content;

		if (!visitorId || !externalId) {
			return {
				status: HttpStatusCode.BAD_REQUEST,
				content: { error: 'visitorId and externalId are required' },
			};
		}

		const visitor = await modify.getUpdater().getLivechatUpdater().updateVisitorExternalId(visitorId, externalId);

		return {
			status: HttpStatusCode.OK,
			content: { visitor: visitor || null },
		};
	}
}
```

</details>

#### Nested Requests simulation

File name: `nested-requests_0.0.1.zip`

An app that simulates a "nested request" scenario. It listens for `IPostMessageSent` events, and provides a slashcommand that sends a message. Executing the slashcommand will create a scenario where the event handler for `IPostMessageSent` will be triggered by the slashcommand executor handler.

This situation used to cause logs for the originating handler (the slashcommand executor, in this case) to disappear, and only the logs for the nested request (`IPostMessageSent` handler, in this case) would be persisted to the database.

<details>
<summary>App source code</summary>

```typescript
export class NestedRequestsApp extends App implements IPostMessageSent {
	public async executePostMessageSent(
		message: IMessage,
		_read: IRead,
		_http: IHttp,
		_persistence: IPersistence,
		_modify: IModify,
	): Promise<void> {
		this.getLogger().debug('executed_post_message_sent', message.id);
	}

	protected async extendConfiguration(configuration: IConfigurationExtend, _environmentRead: IEnvironmentRead): Promise<void> {
		configuration.slashCommands.provideSlashCommand(
			new (class implements ISlashCommand {
				public command = 'nest';
				public i18nParamsExample = 'nest';
				public i18nDescription = 'nest';
				public providesPreview = false;

				constructor(private readonly app: IApp) {}

				public async executor(
					context: SlashCommandContext,
					_read: IRead,
					modify: IModify,
					_http: IHttp,
					_persis: IPersistence,
				): Promise<void> {
					const [execId] = context.getArguments();

					this.app.getLogger().debug('slashcommand_triggered', execId);

					const mb = modify.getCreator().startMessage().setText(`nested_test_message ${execId}`).setRoom(context.getRoom());

					const id = await modify.getCreator().finish(mb);

					this.app.getLogger().debug('slashcommand_message_sent', id);
				}
			})(this),
		);
	}
}
```

</details>

#### Update Status Test

File name: `update-status-test_0.0.1.zip`

An app that provides two public API endpoints to test the `updateStatus` and `updateStatusText` bridge methods. A `username` parameter is required to specify the target user.

**Endpoints:**

- `POST /update-status` — Calls `updateStatus(user, statusText, status)`. Expects `{ username: string, status: string, statusText?: string }`.
- `POST /update-status-text` — Calls `updateStatusText(user, statusText)`. Expects `{ username: string, statusText: string }`.

<details>
<summary>App source code</summary>

**UpdateStatusTestApp.ts**
```typescript
import {
    IAppAccessors,
    IConfigurationExtend,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { UpdateStatusEndpoint } from './endpoints/UpdateStatusEndpoint';
import { UpdateStatusTextEndpoint } from './endpoints/UpdateStatusTextEndpoint';

export class UpdateStatusTestApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await configuration.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [
                new UpdateStatusEndpoint(this),
                new UpdateStatusTextEndpoint(this),
            ],
        });
    }
}
```

**endpoints/UpdateStatusEndpoint.ts**
```typescript
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export class UpdateStatusEndpoint extends ApiEndpoint {
    public path = 'update-status';

    public async post(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<IApiResponse> {
        const { status, statusText = '', username } = request.content || {};

        if (!status) {
            return { status: 400, content: 'status is required' };
        }

        if (!username) {
            return { status: 400, content: 'username is required' };
        }

        const user = await read.getUserReader().getByUsername(username) as IUser;

        if (!user) {
            return { status: 404, content: 'User not found' };
        }

        await modify.getUpdater().getUserUpdater().updateStatus(user, statusText, status);

        return this.success(JSON.stringify({ status, statusText }));
    }
}
```

**endpoints/UpdateStatusTextEndpoint.ts**
```typescript
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export class UpdateStatusTextEndpoint extends ApiEndpoint {
    public path = 'update-status-text';

    public async post(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<IApiResponse> {
        const { statusText, username } = request.content || {};

        if (typeof statusText !== 'string') {
            return { status: 400, content: 'statusText is required' };
        }

        if (!username) {
            return { status: 400, content: 'username is required' };
        }

        const user = await read.getUserReader().getByUsername(username) as IUser;

        if (!user) {
            return { status: 404, content: 'User not found' };
        }

        await modify.getUpdater().getUserUpdater().updateStatusText(user, statusText);

        return this.success(JSON.stringify({ statusText }));
    }
}
```

</details>

#### Message Reaction Test

File name: `message-updater-test_0.0.1.zip`

An app used to test the message reaction updates. Provides a `/msg-update` slashcommand that takes an action of `'add' | 'remove'` and a message id, then adds or removes a reaction in the target message accordingly using the App's bot user.

<details>
<summary>App source code</summary>

```typescript
export class MessageUpdaterTestApp extends App {
    protected async extendConfiguration(configuration: IConfigurationExtend, _environmentRead: IEnvironmentRead): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new class UpdateCommand implements ISlashCommand {
            command = 'msg-update';
            i18nDescription = 'msg-update';
            i18nParamsExample = 'msg-update';
            providesPreview = false;

            constructor(private readonly app: App) { }

            public async executor(context: SlashCommandContext, read: IRead, modify: IModify, _http: IHttp, _persis: IPersistence) {
                const [action, msgId] = context.getArguments() as ['add' | 'remove', string];

                const user = await read.getUserReader().getAppUser();

                if (!user) {
                    this.app.getLogger().error(`Couldn't find app user`);
                    return;
                }

                if (action === 'add') {
                    await modify.getUpdater().getMessageUpdater().addReaction(msgId, user.id, ':+1:');
                    this.app.getLogger().debug(`Added reaction 👍 to message ${msgId}`);
                } else {
                    await modify.getUpdater().getMessageUpdater().removeReaction(msgId, user.id, ':+1:');
                    this.app.getLogger().debug(`Removed reaction 👍 from message ${msgId}`);
                }
            }
        }(this));
    }
}
```

#### UIKit Room Context Test

File name: `uikit-room-test_0.0.1.zip`

An app that validates room context propagation and interaction data in UIKit interactions across all surfaces (message, modal, contextual bar). It provides a slash command (`open-uikit-room-test-modal`) with three actions:

- `modal` - Opens a modal with a button and submit action
- `ctx` - Opens a contextual bar with a button and submit action
- `message` - Sends a message with a button

It also takes a second argument with a random "seed" used to identify the current execution context.

Each interaction handler (`executeBlockActionHandler`, `executeViewSubmitHandler`, `executeViewClosedHandler`) logs detailed data including room ID, user name, view id, block value, triggerId, actionId, and container type. These logs are used by Playwright e2e tests to verify that interaction data is correctly propagated.

<details>
<summary>App source code</summary>

```typescript
import {
	IAppAccessors,
	IConfigurationExtend,
	IEnvironmentRead,
	IHttp,
	ILogger,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import {
	IUIKitInteractionHandler,
	IUIKitResponse,
	UIKitBlockInteractionContext,
	UIKitViewCloseInteractionContext,
	UIKitViewSubmitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import { AppMethod } from '@rocket.chat/apps-engine/definition/metadata';
import { UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';

export class UiKitRoomTestApp extends App implements IUIKitInteractionHandler {
	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	async [AppMethod.UIKIT_BLOCK_ACTION](
		context: UIKitBlockInteractionContext,
		_read: IRead,
		_http: IHttp,
		_persistence: IPersistence,
		_modify: IModify,
	): Promise<IUIKitResponse> {
		const data = context.getInteractionData();
		this.getLogger().debug('block_action_room', data.room ? data.room.id : 'no-room');
		this.getLogger().debug('block_action_user', data.user ? data.user.username : 'no-user');
		this.getLogger().debug('block_action_triggerId', data.triggerId || 'no-triggerId');
		this.getLogger().debug('block_action_actionId', data.actionId || 'no-actionId');
		this.getLogger().debug('block_action_value', data.value);
		this.getLogger().debug('block_action_container', data.container ? data.container.type : 'no-container');
		return context.getInteractionResponder().successResponse();
	}

	async [AppMethod.UIKIT_VIEW_SUBMIT](
		context: UIKitViewSubmitInteractionContext,
		_read: IRead,
		_http: IHttp,
		_persistence: IPersistence,
		_modify: IModify,
	): Promise<IUIKitResponse> {
		const data = context.getInteractionData();
		this.getLogger().debug('view_submit_room', data.room ? data.room.id : 'no-room');
		this.getLogger().debug('view_submit_user', data.user ? data.user.username : 'no-user');
		this.getLogger().debug('view_submit_id', data.view.id);
		this.getLogger().debug('view_submit_triggerId', data.triggerId || 'no-triggerId');
		this.getLogger().debug('view_submit_actionId', data.actionId || 'no-actionId');
		return context.getInteractionResponder().successResponse();
	}

	async [AppMethod.UIKIT_VIEW_CLOSE](
		context: UIKitViewCloseInteractionContext,
		_read: IRead,
		_http: IHttp,
		_persistence: IPersistence,
		_modify: IModify,
	): Promise<IUIKitResponse> {
		const data = context.getInteractionData();
		this.getLogger().debug('view_closed_room', data.room ? data.room.id : 'no-room');
		this.getLogger().debug('view_closed_user', data.user ? data.user.username : 'no-user');
		this.getLogger().debug('view_closed_id', data.view.id);
		this.getLogger().debug('view_closed_triggerId', data.triggerId || 'no-triggerId');
		this.getLogger().debug('view_closed_actionId', data.actionId || 'no-actionId');
		return context.getInteractionResponder().successResponse();
	}

	protected async extendConfiguration(configuration: IConfigurationExtend, _environmentRead: IEnvironmentRead): Promise<void> {
		await configuration.slashCommands.provideSlashCommand({
			command: 'open-uikit-room-test-modal',
			i18nDescription: '',
			i18nParamsExample: '',
			providesPreview: false,
			executor: async (context, _read, modify, _http, _persis) => {
				const [action, seed] = context.getArguments();
				const triggerId = context.getTriggerId();

				if (!triggerId) {
					this.getLogger().error('No triggerId provided to slash command');
					return;
				}

				if (action === 'modal') {
					await modify.getUiController().openSurfaceView(
						{
							id: `modal-${seed}`,
							title: { type: 'plain_text', text: 'UIKit Room Test Modal' },
							type: UIKitSurfaceType.MODAL,
							blocks: [
								{
									type: 'section',
									text: { type: 'plain_text', text: 'This modal tests room context in UIKit interactions.' },
								},
								{
									type: 'actions',
									elements: [{ type: 'button', value: seed, actionId: 'modal-button', text: { type: 'plain_text', text: 'Click!' } }],
								},
							],
							submit: {
								type: 'button',
								actionId: `modal-submit-${seed}`,
								text: { type: 'plain_text', text: 'Submit' },
							},
						},
						{ triggerId },
						context.getSender(),
					);
				}

				if (action === 'ctx') {
					await modify.getUiController().openSurfaceView(
						{
							id: `ctx-${seed}`,
							title: { type: 'plain_text', text: 'UIKit Room Test Contextual Bar' },
							type: UIKitSurfaceType.CONTEXTUAL_BAR,
							blocks: [
								{
									type: 'section',
									text: { type: 'plain_text', text: 'This contextual bar tests room context.' },
								},
								{
									type: 'actions',
									elements: [{ type: 'button', value: seed, actionId: 'ctx-button', text: { type: 'plain_text', text: 'Click!' } }],
								},
							],
							submit: {
								type: 'button',
								actionId: `ctxbar-submit-${seed}`,
								text: { type: 'plain_text', text: 'Submit' },
							},
						},
						{ triggerId },
						context.getSender(),
					);
				}

				if (action === 'message') {
					const msg = modify
					.getCreator()
					.startMessage()
					.setRoom(context.getRoom())
					.setBlocks([
						{
							type: 'section',
							text: { type: 'plain_text', text: 'This message tests room context.' },
						},
						{
							type: 'actions',
							elements: [{ type: 'button', value: seed, actionId: 'msg-button', text: { type: 'plain_text', text: 'Click!' } }],
						},
					]);

					await modify.getCreator().finish(msg);
				}
			},
		});
	}
}
```

</details>

#### Media call lifecycle events (IMediaCallHandler)

File name: `media-call-events-test_0.0.1.zip`

An app implementing every method of `IMediaCallHandler`. It records what each handler received in the app
logs, which is how `tests/e2e/apps/media-call-events.spec.ts` asserts the events actually arrived, and it
answers the pre-create event according to a mode the test sets beforehand.

**Mode endpoint:**

- `POST /api/apps/public/:appId/mode` with `{ "mode": "pass" | "prevent" | "prevent-i18n" | "drop-screen-share" }`
- `GET /api/apps/public/:appId/mode` returns the current mode (defaults to `pass`)

The mode drives `executePreMediaCallCreated`:

| Mode | Returns |
| --- | --- |
| `pass` | `EventResult.pass()` |
| `prevent` | `EventResult.prevent({ reason: 'blocked by media-call-events-test' })` |
| `prevent-i18n` | `EventResult.prevent({ i18n: { key, args } })`, naming `call_prevented_for_callee` with the callee's username |
| `drop-screen-share` | `EventResult.patch({ features })` with `screen-share` removed |

`prevent-i18n` is why this package ships an `i18n/en.json`. An app that refuses a call by naming a key
says nothing readable on its own, so the host reads the app's own wording for that key and stores a copy of
it on the call - the only copy left once the app is uninstalled. The wording interpolates `{{callee}}`, so
the stored copy proves the arguments were applied and not stored unexpanded.

Driving the outcome from a mode rather than from the callee's username matters: a call that fails because the
callee was unreachable looks identical in the UI to one an app blocked, so the tests need to run the *same*
user pair through both a passing and a prevented call.

**Log labels** (read with `findAppLogItem`): `pre_created_mode`, `pre_created_caller`, `pre_created_callee`,
`pre_created_created_by`, `pre_created_features`, `pre_created_caller_keys`, `post_started_*`,
`post_joined_*`, `post_ended_*`. `pre_created_caller_keys` / `post_joined_participant_keys` list the keys of
the contact the app received, so a test can assert the per-session signing token (`contractId`) never
crossed into the app.

A post event's context holds the call and nothing the call already holds, so the app reads the moment of the
event and the participant that joined off the call itself: `post_started_activated_at`,
`post_joined_participant` (`call.callee`), `post_joined_accepted_at` and `post_ended_at`.

Three of the end-event labels exist to exercise the outcome helpers, since there is no separate event for
a call nobody answered:

| Label | Value |
| --- | --- |
| `post_ended_outcome` | `answered` \| `rejected` \| `missed`, from `isAnsweredCall` / `isRejectedCall` / `isMissedCall`. `unreachable` would mean the three stopped partitioning every ended call, and the spec asserts it never appears. |
| `post_ended_accepted_at` | Logged **only** inside the `isAnsweredCall` branch, so its presence is the guard firing and its absence is the guard correctly refusing. |
| `post_ended_reason_known` | `isKnownMediaCallHangupReason(context.call.hangupReason)`. A `false` here means `MediaCallHangupReason` has drifted from what the server records. |

<details>
<summary>App source code</summary>

```typescript
import { App } from '@rocket.chat/apps-engine/definition/App';
import type {
	IAppAccessors,
	IConfigurationExtend,
	IHttp,
	ILogger,
	IModify,
	IPersistence,
	IPersistenceRead,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { HttpStatusCode } from '@rocket.chat/apps-engine/definition/accessors';
import type { IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { ApiEndpoint, ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { EventResult } from '@rocket.chat/apps-engine/definition/eventResult';
import { isAnsweredCall, isKnownMediaCallHangupReason, isMissedCall, isRejectedCall } from '@rocket.chat/apps-engine/definition/mediaCalls';
import type {
	IMediaCallContact,
	IMediaCallEndedContext,
	IMediaCallHandler,
	IMediaCallParticipantJoinedContext,
	IMediaCallStartedContext,
	IPreMediaCallCreatedContext,
	MediaCallCreateEventResult,
} from '@rocket.chat/apps-engine/definition/mediaCalls';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { AppMethod, RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

/**
 * How the app should answer the next `executePreMediaCallCreated`. Tests set this
 * over the `mode` endpoint before driving a call, so a single user pair can be run
 * through every outcome instead of encoding the outcome in the callee's username.
 */
type Mode = 'pass' | 'prevent' | 'prevent-i18n' | 'drop-screen-share';

const MODES: Mode[] = ['pass', 'prevent', 'prevent-i18n', 'drop-screen-share'];

/**
 * The key the app names in `prevent-i18n` mode. The app ships its own wording for it in
 * `i18n/en.json`, and nothing on the server side knows that wording: the host has to read it
 * off the app to store a copy that survives the app's uninstall.
 */
const PREVENTION_I18N_KEY = 'call_prevented_for_callee';

const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'media-call-events-test-mode');

/**
 * Exercises every method of `IMediaCallHandler` and records what it saw in the app
 * logs, which is how the e2e spec asserts the events actually arrived.
 */
export class MediaCallEventsTestApp extends App implements IMediaCallHandler {
	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	public async [AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED](
		context: IPreMediaCallCreatedContext,
		read: IRead,
	): Promise<MediaCallCreateEventResult> {
		const mode = await readMode(read.getPersistenceReader());

		this.getLogger().debug('pre_created_mode', mode);
		this.getLogger().debug('pre_created_caller', context.caller.username);
		this.getLogger().debug('pre_created_callee', context.callee.username);
		this.getLogger().debug('pre_created_created_by', context.createdBy.username);
		this.getLogger().debug('pre_created_features', [...context.features].sort().join(','));
		// Proves at the real serialization boundary that no credential rode along with
		// the contact - `contractId` is the per-session signing token the host strips.
		this.getLogger().debug('pre_created_caller_keys', contactKeys(context.caller));
		this.getLogger().debug('pre_created_origin', context.origin);

		if (mode === 'prevent') {
			return EventResult.prevent({ reason: 'blocked by media-call-events-test' });
		}

		// The same refusal, said the other way: the app names a key it ships instead of words, so
		// the reason reads in each reader's own language for as long as the app is installed.
		if (mode === 'prevent-i18n') {
			return EventResult.prevent({ i18n: { key: PREVENTION_I18N_KEY, args: { callee: context.callee.username ?? '' } } });
		}

		if (mode === 'drop-screen-share') {
			return EventResult.patch({ features: context.features.filter((feature) => feature !== 'screen-share') });
		}

		return EventResult.pass();
	}

	public async [AppMethod.EXECUTE_POST_MEDIA_CALL_STARTED](context: IMediaCallStartedContext): Promise<void> {
		this.getLogger().debug('post_started_call', context.call.id);
		this.getLogger().debug('post_started_state', context.call.state);
		this.getLogger().debug('post_started_features', [...context.call.features].sort().join(','));
		this.getLogger().debug('post_started_activated_at', context.call.activatedAt.toISOString());
		// Both shapes carry the origin, so the app can prove the pre context and the call agree
		this.getLogger().debug('post_started_origin', context.call.origin);
	}

	public async [AppMethod.EXECUTE_POST_MEDIA_CALL_PARTICIPANT_JOINED](context: IMediaCallParticipantJoinedContext): Promise<void> {
		this.getLogger().debug('post_joined_call', context.call.id);
		// Calls are two-party, so the side that joined is the callee of the call itself
		this.getLogger().debug('post_joined_participant', context.call.callee.username);
		this.getLogger().debug('post_joined_participant_keys', contactKeys(context.call.callee));
		this.getLogger().debug('post_joined_accepted_at', context.call.acceptedAt.toISOString());
	}

	public async [AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED](context: IMediaCallEndedContext): Promise<void> {
		this.getLogger().debug('post_ended_call', context.call.id);
		this.getLogger().debug('post_ended_ended', String(context.call.ended));
		this.getLogger().debug('post_ended_at', context.call.endedAt.toISOString());
		this.getLogger().debug('post_ended_by_type', context.call.endedBy?.type ?? 'none');
		this.getLogger().debug('post_ended_reason', context.call.hangupReason ?? 'none');
		this.getLogger().debug('post_ended_duration_ms', String(context.durationMs));
		this.getLogger().debug('post_ended_reason_known', String(isKnownMediaCallHangupReason(context.call.hangupReason)));
		this.getLogger().debug('post_ended_outcome', describeOutcome(context));

		if (isAnsweredCall(context)) {
			// The guard narrows `acceptedAt` to a required Date, so this needs no assertion.
			this.getLogger().debug('post_ended_accepted_at', context.call.acceptedAt.toISOString());
		}
	}

	protected override async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
		await configuration.api.provideApi({
			visibility: ApiVisibility.PUBLIC,
			security: ApiSecurity.UNSECURE,
			endpoints: [
				/** `POST /api/apps/public/:appId/mode` with `{ "mode": Mode }` - see `MODES`. */
				new (class extends ApiEndpoint {
					public override path = 'mode';

					public async post(
						request: IApiRequest,
						_endpoint: IApiEndpointInfo,
						_read: IRead,
						_modify: IModify,
						_http: IHttp,
						persistence: IPersistence,
					): Promise<IApiResponse> {
						const { mode } = (request.content || {}) as { mode?: Mode };

						if (!mode || !MODES.includes(mode)) {
							return {
								status: HttpStatusCode.BAD_REQUEST,
								content: { error: `mode must be one of ${MODES.join(', ')}` },
							};
						}

						await persistence.updateByAssociation(association, { mode }, true);

						return { status: HttpStatusCode.OK, content: { mode } };
					}

					public async get(_request: IApiRequest, _endpoint: IApiEndpointInfo, read: IRead): Promise<IApiResponse> {
						return { status: HttpStatusCode.OK, content: { mode: await readMode(read.getPersistenceReader()) } };
					}
				})(this),
			],
		});
	}
}

async function readMode(persistenceRead: IPersistenceRead): Promise<Mode> {
	const [record] = (await persistenceRead.readByAssociation(association)) as { mode?: Mode }[];

	return record?.mode ?? 'pass';
}

function contactKeys(contact: IMediaCallContact): string {
	return Object.keys(contact).sort().join(',');
}

/**
 * There is no event for a call nobody answered, so an app has to read the outcome
 * off the end event. `'unreachable'` can never be logged: the three guards partition
 * every ended call, and the e2e spec asserts the label never appears.
 */
function describeOutcome(context: IMediaCallEndedContext): string {
	if (isAnsweredCall(context)) {
		return 'answered';
	}

	if (isRejectedCall(context)) {
		return 'rejected';
	}

	if (isMissedCall(context)) {
		return 'missed';
	}

	return 'unreachable';
}
```

</details>
