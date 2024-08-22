import { CloudWorkspaceError } from './CloudWorkspaceError';

export class CloudWorkspaceConnectionError extends CloudWorkspaceError {
	constructor(message: string) {
		super(message);
		this.name = CloudWorkspaceConnectionError.name;
	}
}
