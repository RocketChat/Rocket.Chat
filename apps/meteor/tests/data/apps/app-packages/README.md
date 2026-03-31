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

### Available apps

#### IPreFileUpload handler

File name: `file-upload-test_0.0.1.zip`

An app that handles the `IPreFileUpload` event. If the file name starts with `"test-should-reject"`, the app will prevent the upload from happening. The error message will contain the contents of the uploaded file as evidence that the app could successfully read them.

<details>
<summary>App source code</summary>

```typescript
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { FileUploadNotAllowedException } from '@rocket.chat/apps-engine/definition/exceptions';
import { IPreFileUpload } from '@rocket.chat/apps-engine/definition/uploads';
import { IFileUploadContext } from '@rocket.chat/apps-engine/definition/uploads/IFileUploadContext';

export class TestIPreFileUpload extends App implements IPreFileUpload {
    public async executePreFileUpload(context: IFileUploadContext, read: IRead, http: IHttp, persis: IPersistence, modify: IModify): Promise<void> {
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
import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
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
            endpoints: [
                new TestEndpoint(this),
            ]
        })
    }
}
```

**TestEndpoint.ts**
```typescript
import {
    HttpStatusCode,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ApiEndpoint,
    IApiEndpointInfo,
    IApiRequest,
    IApiResponse,
} from "@rocket.chat/apps-engine/definition/api";

export class TestEndpoint extends ApiEndpoint {
    public path = "api/:param1/:param2/test";

    public async get(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
    ): Promise<IApiResponse> {
        return {
            content: `Param1: ${request.params.param1}, Param2: ${request.params.param2}`,
            status: HttpStatusCode.OK,
            headers: {
                "Content-Type": "text/plain",
            },
        }
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
    public async executePostMessageSent(message: IMessage, _read: IRead, _http: IHttp, _persistence: IPersistence, _modify: IModify): Promise<void> {
        this.getLogger().debug('executed_post_message_sent', message.id);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend, _environmentRead: IEnvironmentRead): Promise<void> {
        configuration.slashCommands.provideSlashCommand(new class implements ISlashCommand {
            public command= 'nest';
            public i18nParamsExample = 'nest';
            public i18nDescription = 'nest';
            public providesPreview = false;

            constructor(private readonly app: IApp) { }

            public async executor(context: SlashCommandContext, _read: IRead, modify: IModify, _http: IHttp, _persis: IPersistence): Promise<void> {
                const [execId] = context.getArguments();

                this.app.getLogger().debug('slashcommand_triggered', execId);

                const mb = modify.getCreator().startMessage()
                    .setText(`nested_test_message ${execId}`)
                    .setRoom(context.getRoom());

                const id = await modify.getCreator().finish(mb);

                this.app.getLogger().debug('slashcommand_message_sent', id);
            }
        }(this));
    }
}
```

</details>
