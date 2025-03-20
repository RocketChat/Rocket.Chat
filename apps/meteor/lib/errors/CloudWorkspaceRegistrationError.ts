import { CloudWorkspaceError } from './CloudWorkspaceError';

export class CloudWorkspaceRegistrationError extends CloudWorkspaceError {
	constructor(message: string) {
		super(message);
		this.name = CloudWorkspaceRegistrationError.name;
	}
}
