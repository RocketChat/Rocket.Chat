import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import _ from 'lodash';
import React, { FC } from 'react';

import { SectionStatus } from '../Section';
import { DNSRecordItem } from './DNSRecordItem';
import { DNSText } from './DNSText';
import { DNSRecord, DNSRecordName, DNSRecordType, ResolvedDNS, TXTRecordValue } from './Types';

export const DNSRecords: FC<{
	federationSubdomain: string;
	rocketChatProtocol: string;
	federationPublicKey: string;
	rocketChatDomain: string;
	rocketChatPort: string;
	resolvedEntries: ResolvedDNS;
	legacy?: boolean;
}> = ({ federationSubdomain, rocketChatProtocol, federationPublicKey, rocketChatDomain, rocketChatPort, resolvedEntries, legacy }) => {
	const t = useTranslation();

	function buildDNSRecord(
		type: DNSRecordType,
		name: DNSRecordName | TXTRecordValue,
		expectedValue: string,
		options: {
			rootLevelEntry: boolean;
			longValueTitle?: string;
			title?: string;
		} = {
			rootLevelEntry: false,
		},
	): DNSRecord {
		const { rootLevelEntry, longValueTitle } = options || {};
		let { title } = options || {};

		if (type === DNSRecordType.TXT && !rootLevelEntry && !title) {
			title = 'Value';
		}

		const dnsRecord: DNSRecord = {
			status: SectionStatus.UNKNOWN,
			title: title || _.capitalize(name.toString()),
			expectedValue,
		};

		if (rootLevelEntry) {
			dnsRecord.value = dnsRecord.expectedValue;
		}

		switch (type) {
			case DNSRecordType.SRV: {
				const value = resolvedEntries[type][name as DNSRecordName];

				if (value) {
					dnsRecord.value = value.toString();
				}
				break;
			}
			case DNSRecordType.TXT: {
				if (!rootLevelEntry) {
					dnsRecord.value = resolvedEntries[type][name as TXTRecordValue];
				}
				break;
			}
		}

		// Check the status

		// If this is a root level entry, it will always fail if we can't find a resolved entry
		if (rootLevelEntry) {
			switch (type) {
				case DNSRecordType.SRV: {
					dnsRecord.status = Object.keys(resolvedEntries[type]).length > 0 ? SectionStatus.SUCCESS : SectionStatus.FAILED;
					break;
				}
				case DNSRecordType.TXT: {
					dnsRecord.status = resolvedEntries[type][name as TXTRecordValue] ? SectionStatus.SUCCESS : SectionStatus.UNKNOWN;
					break;
				}
			}
		}

		// If the entry is not failed, check the value
		if (dnsRecord.status !== SectionStatus.FAILED) {
			dnsRecord.status = dnsRecord.value === expectedValue ? SectionStatus.SUCCESS : SectionStatus.FAILED;
		}

		// If the entry has a long value, hide it
		if (longValueTitle) {
			dnsRecord.expectedValue = longValueTitle;
			dnsRecord.value = `${dnsRecord.value?.substr(0, 40)}...`;
		}

		// If this is a root level entry, we hide the error string
		dnsRecord.hideErrorString = rootLevelEntry;

		return dnsRecord;
	}

	const srvDNSRecords: DNSRecord[] = [
		buildDNSRecord(DNSRecordType.SRV, DNSRecordName.SERVICE, '_rocketchat', {
			rootLevelEntry: true,
		}),
		buildDNSRecord(DNSRecordType.SRV, DNSRecordName.PROTOCOL, legacy ? '_tcp' : `_${rocketChatProtocol}`, {
			rootLevelEntry: true,
		}),
		buildDNSRecord(DNSRecordType.SRV, DNSRecordName.NAME, federationSubdomain, {
			rootLevelEntry: true,
		}),
		buildDNSRecord(DNSRecordType.SRV, DNSRecordName.TARGET, rocketChatDomain),
		buildDNSRecord(DNSRecordType.SRV, DNSRecordName.PORT, rocketChatPort),
		buildDNSRecord(DNSRecordType.SRV, DNSRecordName.WEIGHT, '1'),
		buildDNSRecord(DNSRecordType.SRV, DNSRecordName.PRIORITY, '1'),
		buildDNSRecord(DNSRecordType.SRV, DNSRecordName.TTL, '1', {
			rootLevelEntry: true,
			title: 'TTL',
		}),
	];

	const txtDNSRecords: DNSRecord[] = [
		buildDNSRecord(DNSRecordType.TXT, DNSRecordName.HOST, `rocketchat-public-key${federationSubdomain ? `.${federationSubdomain}` : ''}`, {
			rootLevelEntry: true,
		}),
		buildDNSRecord(DNSRecordType.TXT, TXTRecordValue.PUBLIC_KEY, federationPublicKey, {
			rootLevelEntry: false,
			longValueTitle: '<my-public-key>',
		}),
	];

	let legacyTxtDNSRecords: DNSRecord[] = [];

	if (legacy) {
		legacyTxtDNSRecords = [
			buildDNSRecord(
				DNSRecordType.TXT,
				DNSRecordName.PROTOCOL,
				`rocketchat-tcp-protocol${federationSubdomain ? `.${federationSubdomain}` : ''}`,
				{
					rootLevelEntry: true,
				},
			),
			buildDNSRecord(DNSRecordType.TXT, TXTRecordValue.PROTOCOL, rocketChatProtocol),
		];
	}

	return (
		<>
			<DNSText text={t('Federation_Must_add_records')} />
			<Box mbs='x16'>
				<DNSText text={t('Federation_SRV_records_200')} />
				<Box mbs='x8'>
					{srvDNSRecords.map((record: DNSRecord) => (
						<DNSRecordItem key={record.title} record={record} />
					))}
				</Box>
			</Box>
			<Box mbs='x16'>
				<DNSText text={t('Federation_Public_key_TXT_record')} />
				<Box mbs='x8'>
					{txtDNSRecords.map((record: DNSRecord) => (
						<DNSRecordItem key={record.title} record={record} />
					))}
				</Box>
			</Box>
			{!legacy && (
				<Box mbs='x16' p='x16' bg='disabled' fontSize='x12'>
					<Box fontWeight='c2'>{t('Federation_HTTP_instead_HTTPS')}</Box>
					{t('Federation_HTTP_instead_HTTPS_details')}
				</Box>
			)}
			{legacy && (
				<Box mbs='x16'>
					<DNSText text={t('Federation_Protocol_TXT_record')} />
					<Box mbs='x8'>
						{legacyTxtDNSRecords.map((record: DNSRecord) => (
							<DNSRecordItem key={record.title} record={record} />
						))}
					</Box>
				</Box>
			)}
		</>
	);
};
