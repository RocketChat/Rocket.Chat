import { CloudWorkspaceError } from './CloudWorkspaceError';

export class CloudWorkspaceConnectionError extends CloudWorkspaceError {
	override name = CloudWorkspaceConnectionError.name;
}
