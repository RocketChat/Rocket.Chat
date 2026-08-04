import { CloudWorkspaceError } from './CloudWorkspaceError';

export class CloudWorkspaceLicenseError extends CloudWorkspaceError {
	override name = CloudWorkspaceLicenseError.name;
}
