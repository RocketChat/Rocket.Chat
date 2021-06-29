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
import * as psl from 'psl';
import React, { FC, ReactElement, ReactText, useCallback, useMemo, useState } from 'react';

import { useSetting, useSettingSetValue } from '../../../../../contexts/SettingsContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { useForm } from '../../../../../hooks/useForm';
import { SectionStatus } from './Section';
import getStatusIcon from './SectionStatusIcon';

const DNSText: FC<{
	text: string;
}> = ({ text }) => <Box style={{ marginTop: 8, fontWeight: 'bold', fontSize: '95%' }}>{text}</Box>;

const DNSRecord: FC<{
	status: SectionStatus;
	title: string;
	value: string;
}> = ({ status, title, value }) => (
	<Box display='flex' alignItems='flex-start'>
		{getStatusIcon(status)}
		<Box flexDirection='column' style={{ marginTop: -2, fontWeight: 'bold', fontSize: '85%' }}>
			{title}: {value}
		</Box>
	</Box>
);

type ResolvedDNS = {
	srv: Record<string, ReactText> | undefined;
	txt: Record<string, ReactText> | undefined;
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
		{ status: SectionStatus.UNKNOWN, title: 'Service', expectedValue: '_rocketchat' },
		{
			status: SectionStatus.UNKNOWN,
			title: 'Protocol',
			expectedValue: legacy ? '_tcp' : `_${rocketChatProtocol}`,
		},
		{ status: SectionStatus.UNKNOWN, title: 'Name', expectedValue: federationSubdomain },
		{ status: SectionStatus.UNKNOWN, title: 'Target', expectedValue: rocketChatDomain },
		{ status: SectionStatus.UNKNOWN, title: 'Port', expectedValue: rocketChatPort },
		{ status: SectionStatus.UNKNOWN, title: 'Weight', expectedValue: '1' },
		{ status: SectionStatus.UNKNOWN, title: 'Priority', expectedValue: '1' },
		{ status: SectionStatus.UNKNOWN, title: 'TTL', expectedValue: '1' },
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
	const srvURL = useMemo(
		() => ({
			url: `_rocketchat._${rocketChatProtocol}.${federationDomain}`,
		}),
		[rocketChatProtocol, federationDomain],
	);

	const { value: srvResolveResult } = useEndpointData('dns.resolve.srv', srvURL);

	const txtURL = useMemo(
		() => ({
			url: `rocketchat-public-key.${federationSubdomain}`,
		}),
		[rocketChatProtocol, federationDomain],
	);

	const { value: txtResolveResult } = useEndpointData('dns.resolve.txt', txtURL);

	const resolvedDNS: ResolvedDNS = {
		srv: srvResolveResult?.resolved,
		srvResolved: !!srvResolveResult,
		txt: txtResolveResult?.resolved,
		txtResolved: !!txtResolveResult,
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
									rocketChatProtocol={rocketChatProtocol}
									rocketChatDomain={rocketChatDomain}
									rocketChatPort={rocketChatPort}
									basicEntries={['Service', 'Protocol', 'Name', 'TTL', 'Host']}
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
										rocketChatProtocol={rocketChatProtocol}
										rocketChatDomain={rocketChatDomain}
										rocketChatPort={rocketChatPort}
										basicEntries={['Service', 'Protocol', 'Name', 'TTL', 'Host']}
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
							3
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
