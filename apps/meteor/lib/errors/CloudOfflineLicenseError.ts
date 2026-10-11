import { CloudWorkspaceError } from './CloudWorkspaceError';

export class CloudOfflineLicenseError extends CloudWorkspaceError {
	override name = CloudOfflineLicenseError.name;
}
