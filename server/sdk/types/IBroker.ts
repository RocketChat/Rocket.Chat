import { ServiceClass } from './ServiceClass';
import { EventSignatures } from '../lib/Events';

export interface IBrokerNode {
	id: string;
	instanceID: string;
	available: boolean;
	local: boolean;
	// lastHeartbeatTime: 16,
	// config: {},
	// client: { type: 'nodejs', version: '0.14.10', langVersion: 'v12.18.3' },
	// metadata: {},
	// ipList: [ '192.168.0.100', '192.168.1.25' ],
	// port: 59989,
	// hostname: 'RocketChats-MacBook-Pro-Rodrigo-Nascimento.local',
	// udpAddress: null,
	// cpu: 25,
	// cpuSeq: 1,
	// seq: 3,
	// offlineSince: null
}

export interface IBroker {
	destroyService(service: ServiceClass): void;
	createService(service: ServiceClass): void;
	call(method: string, data: any): Promise<any>;
	waitAndCall(method: string, data: any): Promise<any>;
	broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void>;
	nodeList(): Promise<IBrokerNode[]>;
}
