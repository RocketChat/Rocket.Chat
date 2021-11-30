export interface ISession {
	_id: string;

	type: string;
	mostImportantRole: string;
	userId: string;
	lastActivityAt: Date;
	device: {
		type: string;
		name: string;
		longVersion: string;
		os: {
			name: string;
			version: string;
		};
		version: string;
	};
	year: number;
	month: number;
	day: number;
	instanceId: string;
	sessionId: string;
	_updatedAt: Date;
	createdAt: Date;
	host: string;
	ip: string;
	loginAt: Date;
	closedAt: Date;
}
