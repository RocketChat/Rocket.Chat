import { CloudWorkspaceError } from './CloudWorkspaceError';

export class CloudWorkspaceLicenseError extends CloudWorkspaceError {
	constructor(message: string) {
		super(message);
		this.name = CloudWorkspaceLicenseError.name;
	}
}
