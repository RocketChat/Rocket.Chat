import { CloudWorkspaceError } from './CloudWorkspaceError';

export class CloudWorkspaceAccessError extends CloudWorkspaceError {
	constructor(message: string) {
		super(message);
		this.name = CloudWorkspaceAccessError.name;
	}
}
