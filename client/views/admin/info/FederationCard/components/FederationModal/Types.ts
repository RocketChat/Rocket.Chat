import { SectionStatus } from '../Section';

export enum DNSRecordType {
	SRV = 'srv',
	TXT = 'txt',
}

export enum DNSRecordName {
	HOST = 'host',
	NAME = 'name',
	PORT = 'port',
	PRIORITY = 'priority',
	PROTOCOL = 'protocol',
	SERVICE = 'service',
	TARGET = 'target',
	TTL = 'ttl',
	WEIGHT = 'weight',
}

export enum TXTRecordName {
	PUBLIC_KEY,
	PROTOCOL,
}

export type DNSRecord = {
	status: SectionStatus;
	title: string;
	expectedValue: string;
	value?: string;
};

export type ResolvedDNS = {
	[DNSRecordType.SRV]: Record<DNSRecordName, string | number>;
	[DNSRecordType.TXT]: Record<TXTRecordName, string>;
};
