import { Box } from '@rocket.chat/fuselage';
import React, { FC, ReactText } from 'react';

import DNSRecord from './DNSRecord';
import DNSText from './DNSText';
import { SectionStatus } from './Section';

export type ResolvedDNS = {
	srv: Record<string, ReactText> | undefined;
	srvResolved: boolean;
	txt: Record<string, ReactText> | undefined;
	txtResolved: boolean;
};

const DNSRecords: FC<{
	federationSubdomain: string;
	rocketChatProtocol: string;
	rocketChatDomain: string;
	rocketChatPort: string;
	resolvedEntries: ResolvedDNS;
	basicEntries?: string[];
	legacy?: boolean;
}> = ({
	federationSubdomain,
	rocketChatProtocol,
	rocketChatDomain,
	rocketChatPort,
	resolvedEntries,
	basicEntries,
	legacy,
}) => {
	function getDNSRecordStatus(dnsRecord: {
		type: 'srv' | 'txt';
		status: SectionStatus;
		title: string;
		expectedValue: string;
	}): SectionStatus {
		// If this is a basic entry, it will fail or succeed according to the resolved entries
		if (basicEntries?.includes(dnsRecord.title)) {
			return resolvedEntries[dnsRecord.type] ? SectionStatus.SUCCESS : SectionStatus.FAILED;
		}
		// Otherwise, we need to validate if the values match
		if (resolvedEntries[dnsRecord.type]) {
			const resolvedValue = resolvedEntries[dnsRecord.type][dnsRecord.title.toLowerCase()];

			return resolvedValue.toString() === dnsRecord.expectedValue
				? SectionStatus.SUCCESS
				: SectionStatus.FAILED;
		}

		return SectionStatus.UNKNOWN;
	}

	const srvDNSRecords = [
		{
			status: SectionStatus.UNKNOWN,
			title: 'Service',
			expectedValue: '_rocketchat',
			type: 'srv' as const,
		},
		{
			status: SectionStatus.UNKNOWN,
			title: 'Protocol',
			expectedValue: legacy ? '_tcp' : `_${rocketChatProtocol}`,
			type: 'srv' as const,
		},
		{
			status: SectionStatus.UNKNOWN,
			title: 'Name',
			expectedValue: federationSubdomain,
			type: 'srv' as const,
		},
		{
			status: SectionStatus.UNKNOWN,
			title: 'Target',
			expectedValue: rocketChatDomain,
			type: 'srv' as const,
		},
		{
			status: SectionStatus.UNKNOWN,
			title: 'Port',
			expectedValue: rocketChatPort,
			type: 'srv' as const,
		},
		{ status: SectionStatus.UNKNOWN, title: 'Weight', expectedValue: '1', type: 'srv' as const },
		{ status: SectionStatus.UNKNOWN, title: 'Priority', expectedValue: '1', type: 'srv' as const },
		{ status: SectionStatus.UNKNOWN, title: 'TTL', expectedValue: '1', type: 'srv' as const },
	];

	// Define status for SRV DNS records
	for (const dnsRecord of srvDNSRecords) {
		dnsRecord.status = getDNSRecordStatus(dnsRecord);
	}

	return (
		<>
			<DNSText text='You must add the following DNS records on your server:' />
			<DNSText text='SRV Record (2.0.0 or newer)' />
			<Box style={{ marginTop: 10 }}>
				{srvDNSRecords.map(({ status, title, expectedValue }) => (
					<DNSRecord key={title} status={status} title={title} value={expectedValue} />
				))}
			</Box>
			<DNSText text='Public Key TXT Record' />
			<Box style={{ marginTop: 10 }}>
				<DNSRecord
					status={SectionStatus.UNKNOWN}
					title='Host'
					value={`rocketchat-public-key${federationSubdomain ? `.${federationSubdomain}` : ''}`}
				/>
				<DNSRecord status={SectionStatus.UNKNOWN} title='Value' value='<my-public-key>' />
			</Box>
			{legacy && (
				<>
					<DNSText text='Protocol TXT Record' />
					<Box style={{ marginTop: 10 }}>
						<DNSRecord
							status={SectionStatus.UNKNOWN}
							title='Host'
							value={`rocketchat-tcp-protocol${
								federationSubdomain ? `.${federationSubdomain}` : ''
							}`}
						/>
						<DNSRecord status={SectionStatus.UNKNOWN} title='Value' value='http or https' />
					</Box>
				</>
			)}
		</>
	);
};

export default DNSRecords;
