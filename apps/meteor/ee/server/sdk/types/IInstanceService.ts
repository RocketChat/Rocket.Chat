import type { AppStatusReport } from '@rocket.chat/apps';
import type { BrokerNode } from 'moleculer';

export interface IInstanceService {
	getInstances(): Promise<BrokerNode[]>;
	getAppsStatusInInstances(): Promise<AppStatusReport>;
}
