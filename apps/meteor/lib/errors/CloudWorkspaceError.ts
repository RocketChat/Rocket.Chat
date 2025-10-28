export class CloudWorkspaceError extends Error {
	constructor(message: string) {
		super(message);
		this.name = CloudWorkspaceError.name;
	}
}
