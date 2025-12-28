import type { IRocketChatRecord } from './IRocketChatRecord';
import type { $brand } from './utils';

export interface IInstanceStatus extends IRocketChatRecord {
	_id: string & $brand<'instance-status-id'>;
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
