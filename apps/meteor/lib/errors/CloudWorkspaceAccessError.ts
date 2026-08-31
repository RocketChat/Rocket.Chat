import { CloudWorkspaceError } from './CloudWorkspaceError';

export class CloudWorkspaceAccessError extends CloudWorkspaceError {
	override name = CloudWorkspaceAccessError.name;
}
