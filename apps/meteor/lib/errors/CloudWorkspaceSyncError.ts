import { CloudWorkspaceError } from './CloudWorkspaceError';

export class CloudWorkspaceSyncError extends CloudWorkspaceError {
	constructor(message: string) {
		super(message);
		this.name = CloudWorkspaceSyncError.name;
	}
}
