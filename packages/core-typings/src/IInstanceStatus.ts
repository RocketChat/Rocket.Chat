import type { IRocketChatRecord } from './IRocketChatRecord';
import type { Brand } from './utils';

export interface IInstanceStatus extends IRocketChatRecord {
	_id: string & Brand<'instance-status-id'>;
	_createdAt: Date;
	name: string;
	pid: number;
	extraInformation: {
		host: string;
		nodeVersion: string;
		port: string;
		tcpPort: number;
		os: {
			type: string;
			platform: string;
			arch: string;
			release: string;
			uptime: number;
			loadavg: number[];
			totalmem: number;
			freemem: number;
			cpus: number;
		};
	};
}
