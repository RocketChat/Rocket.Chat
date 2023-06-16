import type { IServiceClass } from './ServiceClass';
import type { EventSignatures } from '../Events';

export interface IBrokerNode {
	id: string;
	instanceID?: string;
	available: boolean;
	local?: boolean;
	// lastHeartbeatTime: 16,
	// config: {},
	// client: { type: 'nodejs', version: '0.14.10', langVersion: 'v12.18.3' },
	// metadata: {},
	// ipList: [ '192.168.0.100', '192.168.1.25' ],
	// port: 59989,
	// hostname: 'service.local-1',
	// udpAddress: null,
	// cpu: 25,
	// cpuSeq: 1,
	// seq: 3,
	// offlineSince: null
}

export type BaseMetricOptions = {
	type: string;
	name: string;
	description?: string;
	labelNames?: Array<string>;
	unit?: string;
	aggregator?: string;
};

export interface IServiceMetrics {
	register(opts: BaseMetricOptions): void;

	hasMetric(name: string): boolean;

	increment(name: string, labels?: Record<string, any>, value?: number, timestamp?: number): void;
	decrement(name: string, labels?: Record<string, any>, value?: number, timestamp?: number): void;
	set(name: string, value: any | null, labels?: Record<string, any>, timestamp?: number): void;
	observe(name: string, value: number, labels?: Record<string, any>, timestamp?: number): void;

	reset(name: string, labels?: Record<string, any>, timestamp?: number): void;
	resetAll(name: string, timestamp?: number): void;

	timer(name: string, labels?: Record<string, any>, timestamp?: number): () => number;
}

export interface IBroker {
	metrics?: IServiceMetrics;
	destroyService(service: IServiceClass): Promise<void>;
	createService(service: IServiceClass, serviceDependencies?: string[]): void;
	call(method: string, data: any): Promise<any>;
	waitAndCall(method: string, data: any): Promise<any>;
	broadcastToServices<T extends keyof EventSignatures>(
		services: string[],
		event: T,
		...args: Parameters<EventSignatures[T]>
	): Promise<void>;
	broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void>;
	broadcastLocal<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void>;
	nodeList(): Promise<IBrokerNode[]>;
	start(): Promise<void>;
}
