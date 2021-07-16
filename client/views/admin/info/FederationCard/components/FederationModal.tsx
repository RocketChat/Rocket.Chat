import {
	Box,
	Button,
	ButtonGroup,
	Field,
	FieldGroup,
	Modal,
	Select,
	Tabs,
	TextInput,
} from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import _ from 'lodash';
import * as psl from 'psl';
import React, { FC, ReactElement, useCallback, useState } from 'react';

import { useSetting, useSettingSetValue } from '../../../../../contexts/SettingsContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useForm } from '../../../../../hooks/useForm';
import InviteUsers from './InviteUsers';
import { SectionStatus } from './Section';
import getStatusIcon from './SectionStatusIcon';

const DNSText: FC<{
	text: string;
}> = ({ text }) => <Box style={{ marginTop: 8, fontWeight: 'bold', fontSize: '95%' }}>{text}</Box>;

const DNSRecordItem: FC<{
	status: SectionStatus;
	title: string;
	expectedValue: string;
	value?: string;
}> = ({ status, title, expectedValue, value }) => (
	<Box display='flex' alignItems='flex-start'>
		{getStatusIcon(status)}
		<Box flexDirection='column' style={{ marginTop: -2, fontWeight: 'bold', fontSize: '85%' }}>
			{title}: {expectedValue} {status === SectionStatus.FAILED ? `(${value || '?'})` : ''}
		</Box>
	</Box>
);

enum DNSRecordType {
	SRV = 'srv',
	TXT = 'txt',
}

enum DNSRecordName {
	HOST = 'host',
	NAME = 'name',
	PORT = 'port',
	PRIORITY = 'priority',
	PROTOCOL = 'protocol',
	SERVICE = 'service',
	TARGET = 'target',
	TTL = 'ttl',
	VALUE = 'value',
	WEIGHT = 'weight',
}

enum TXTRecordName {
	PUBLIC_KEY,
	PROTOCOL,
}

type DNSRecord = {
	status: SectionStatus;
	title: string;
	expectedValue: string;
	value?: string;
};

type ResolvedDNS = {
	[DNSRecordType.SRV]: Record<DNSRecordName, string | number>;
	[DNSRecordType.TXT]: Record<TXTRecordName, string>;
};

const DNSRecords: FC<{
	federationSubdomain: string;
	rocketChatProtocol: string;
	federationPublicKey: string;
	rocketChatDomain: string;
	rocketChatPort: string;
	resolvedEntries: ResolvedDNS;
	legacy?: boolean;
}> = ({
	federationSubdomain,
	rocketChatProtocol,
	federationPublicKey,
	rocketChatDomain,
	rocketChatPort,
	resolvedEntries,
	legacy,
}) => {
	function buildDNSRecord(
		type: DNSRecordType,
		name: DNSRecordName | TXTRecordName,
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
			title: title || _.capitalize(name),
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
					dnsRecord.value = resolvedEntries[type][name as TXTRecordName];
				}
				break;
			}
		}

		// Check the status

		// If this is a root level entry, it will always fail if we can't find a resolved entry
		if (rootLevelEntry) {
			dnsRecord.status =
				Object.keys(resolvedEntries[type]).length > 0
					? SectionStatus.SUCCESS
					: SectionStatus.FAILED;
		}

		// If the entry is not failed, check the value
		if (dnsRecord.status !== SectionStatus.FAILED) {
			dnsRecord.status =
				dnsRecord.value === expectedValue ? SectionStatus.SUCCESS : SectionStatus.FAILED;
		}

		// If the entry has a long value, hide it
		if (longValueTitle) {
			dnsRecord.expectedValue = longValueTitle;
			dnsRecord.value = `${dnsRecord.value?.substr(0, 40)}...`;
		}

		return dnsRecord;
	}

	const srvDNSRecords: DNSRecord[] = [
		buildDNSRecord(DNSRecordType.SRV, DNSRecordName.SERVICE, '_rocketchat', {
			rootLevelEntry: true,
		}),
		buildDNSRecord(
			DNSRecordType.SRV,
			DNSRecordName.PROTOCOL,
			legacy ? '_tcp' : `_${rocketChatProtocol}`,
			{
				rootLevelEntry: true,
			},
		),
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
		buildDNSRecord(
			DNSRecordType.TXT,
			DNSRecordName.HOST,
			`rocketchat-public-key${federationSubdomain ? `.${federationSubdomain}` : ''}`,
			{
				rootLevelEntry: true,
			},
		),
		buildDNSRecord(DNSRecordType.TXT, TXTRecordName.PUBLIC_KEY, federationPublicKey, {
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
			buildDNSRecord(DNSRecordType.TXT, TXTRecordName.PROTOCOL, rocketChatProtocol),
		];
	}

	return (
		<>
			<DNSText text='You must add the following DNS records on your server:' />
			<DNSText text='SRV Record (2.0.0 or newer)' />
			<Box style={{ marginTop: 10 }}>
				{srvDNSRecords.map(({ status, title, expectedValue, value }) => (
					<DNSRecordItem
						key={title}
						status={status}
						title={title}
						expectedValue={expectedValue}
						value={value}
					/>
				))}
			</Box>
			<DNSText text='Public Key TXT Record' />
			<Box style={{ marginTop: 10 }}>
				{txtDNSRecords.map(({ status, title, expectedValue, value }) => (
					<DNSRecordItem
						key={title}
						status={status}
						title={title}
						expectedValue={expectedValue}
						value={value}
					/>
				))}
			</Box>
			{legacy && (
				<>
					<DNSText text='Protocol TXT Record' />
					<Box style={{ marginTop: 10 }}>
						{legacyTxtDNSRecords.map(({ status, title, expectedValue, value }) => (
							<DNSRecordItem
								key={title}
								status={status}
								title={title}
								expectedValue={expectedValue}
								value={value}
							/>
						))}
					</Box>
				</>
			)}
		</>
	);
};

const FederationModal: FC<{ onClose: () => void }> = ({ onClose, ...props }): ReactElement => {
	const t = useTranslation();

	// State
	const [currentStep, setCurrentStep] = useState(1);
	const [currentTab, setCurrentTab] = useState(1);

	// Settings
	const siteUrl = useSetting('Site_Url') as string;
	const { protocol, hostname: rocketChatDomain, port: rocketChatPort } = new URL(siteUrl);
	const rocketChatProtocol = protocol.slice(0, -1);

	const federationDomain = useSetting('FEDERATION_Domain') as string;
	const setFederationDomain = useSettingSetValue('FEDERATION_Domain');
	const { subdomain: federationSubdomain } = psl.parse(federationDomain);

	const federationDiscoveryMethod = useSetting('FEDERATION_Discovery_Method') as string;
	const setFederationDiscoveryMethod = useSettingSetValue('FEDERATION_Discovery_Method');

	const federationPublicKey = useSetting('FEDERATION_Public_Key') as string;

	// Form
	const discoveryOptions = [
		['dns', 'DNS (recommended)'],
		['hub', 'HUB'],
	];

	const initialValues = {
		domain: federationDomain,
		discoveryMethod: federationDiscoveryMethod,
	};
	const { values, handlers, hasUnsavedChanges, commit } = useForm(initialValues);

	const { domain, discoveryMethod } = values as { domain: string; discoveryMethod: string };
	const { handleDomain, handleDiscoveryMethod } = handlers;

	const onChangeDomain = useMutableCallback((value) => {
		handleDomain(value);
	});

	const onChangeDiscoveryMethod = useMutableCallback((value) => {
		handleDiscoveryMethod(value);
	});

	// Wizard
	const nextStep = useCallback(() => {
		if (currentStep === 1 && hasUnsavedChanges) {
			setFederationDomain(domain);
			setFederationDiscoveryMethod(discoveryMethod);
			commit();
		}

		if (currentStep === 3) {
			onClose();
		} else {
			setCurrentStep(currentStep + 1);
		}
	}, [currentStep, hasUnsavedChanges, domain, discoveryMethod]);

	const previousStep = useCallback(() => {
		if (currentStep === 1) {
			onClose();
		} else {
			setCurrentStep(currentStep - 1);
		}
	}, [currentStep]);

	// Resolve DNS
	const resolvedSRVString = useSetting('FEDERATION_ResolvedSRV') as string;
	const resolvedSRV: Record<DNSRecordName, string | number> = JSON.parse(resolvedSRVString || '{}');

	const resolvedPublicKeyTXT = useSetting('FEDERATION_ResolvedPublicKeyTXT') as string;
	const resolvedProtocolTXT = useSetting('FEDERATION_ResolvedProtocolTXT') as string;

	const resolvedDNS: ResolvedDNS = {
		srv: resolvedSRV,
		txt: {
			[TXTRecordName.PUBLIC_KEY]: resolvedPublicKeyTXT,
			[TXTRecordName.PROTOCOL]: resolvedProtocolTXT,
		},
	};

	return (
		<Modal {...props}>
			{currentStep === 1 && (
				<>
					<Modal.Header>
						<Modal.Title>{t('Federation')}</Modal.Title>
						<Modal.Close onClick={onClose} />
					</Modal.Header>
					<Modal.Content>
						<FieldGroup>
							<Field>
								<Field.Label>{t('Federation_Domain')}</Field.Label>
								<Field.Description>{t('Federation_Domain_details')}</Field.Description>
								<Field.Row>
									<TextInput placeholder='rocket.chat' value={domain} onChange={onChangeDomain} />
								</Field.Row>
							</Field>
							<Field>
								<Field.Label>{t('Federation_Discovery_method')}</Field.Label>
								<Field.Description>{t('Federation_Discovery_method_details')}</Field.Description>
								<Field.Row>
									<Select
										width='250px'
										value={discoveryMethod || 'dns'}
										options={discoveryOptions}
										onChange={onChangeDiscoveryMethod}
									/>
								</Field.Row>
							</Field>
						</FieldGroup>
					</Modal.Content>
				</>
			)}
			{currentStep === 2 && (
				<>
					<Modal.Header>
						<Modal.Title>{t('Federation_Adding_to_your_server')}</Modal.Title>
						<Modal.Close onClick={onClose} />
					</Modal.Header>
					<Modal.Content>
						<Tabs>
							<Tabs.Item selected={currentTab === 1} onClick={() => setCurrentTab(1)}>
								Configure DNS
							</Tabs.Item>
							<Tabs.Item selected={currentTab === 2} onClick={() => setCurrentTab(2)}>
								Legacy Support
							</Tabs.Item>
						</Tabs>
						<Box style={{ marginTop: 30 }}>
							{currentTab === 1 && (
								<DNSRecords
									federationSubdomain={federationSubdomain}
									federationPublicKey={federationPublicKey}
									rocketChatProtocol={rocketChatProtocol}
									rocketChatDomain={rocketChatDomain}
									rocketChatPort={rocketChatPort}
									resolvedEntries={resolvedDNS}
								/>
							)}
							{currentTab === 2 && (
								<>
									<Box style={{ marginBottom: 15 }}>
										<b>If your DNS provider does not support SRV records with _http or _https</b>
										<p style={{ marginTop: 8 }}>
											Some DNS providers will not allow setting _https or _http on SRV records, so
											we have support for those cases, using our old DNS record resolution method.
										</p>
									</Box>
									<DNSRecords
										federationSubdomain={federationSubdomain}
										federationPublicKey={federationPublicKey}
										rocketChatProtocol={rocketChatProtocol}
										rocketChatDomain={rocketChatDomain}
										rocketChatPort={rocketChatPort}
										resolvedEntries={resolvedDNS}
										legacy={true}
									/>
								</>
							)}
						</Box>
					</Modal.Content>
				</>
			)}
			{currentStep === 3 && (
				<>
					<Modal.Header>
						<Modal.Title>{t('Federation_Adding_users_from_another_server')}</Modal.Title>
						<Modal.Close onClick={onClose} />
					</Modal.Header>
					<Modal.Content>
						<Box display='flex' flexDirection='column' alignItems='stretch' flexGrow={1}>
							<InviteUsers />
						</Box>
					</Modal.Content>
				</>
			)}
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={previousStep}>{currentStep === 1 ? t('Cancel') : t('Back')}</Button>
					<Button primary onClick={nextStep}>
						{currentStep === 3 ? t('Finish') : t('Next')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default FederationModal;
