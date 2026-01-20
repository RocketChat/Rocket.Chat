# Test App Packages

Includes pre-built app packages that are designed to test specific APIs exposed by the Apps-engine.

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
