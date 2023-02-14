import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Button, Field, FieldGroup, Modal, Select, Tabs, TextInput } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useSettingSetValue, useTranslation } from '@rocket.chat/ui-contexts';
import type { ParsedDomain } from 'psl';
import { parse as parseDomain } from 'psl';
import type { FC, ReactElement } from 'react';
import React, { useCallback, useState } from 'react';

import { useForm } from '../../../../../../hooks/useForm';
import { DNSRecords } from './DNSRecords';
import InviteUsers from './InviteUsers';
import type { DNSRecordName, ResolvedDNS } from './Types';
import { TXTRecordValue } from './Types';

export const FederationModal: FC<{ onClose: () => void }> = ({ onClose, ...props }): ReactElement => {
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

	let federationSubdomain = '';
	const parsedDomain = parseDomain(federationDomain);
	if ((parsedDomain as ParsedDomain)?.subdomain) {
		federationSubdomain = (parsedDomain as ParsedDomain).subdomain || '';
	}

	const federationDiscoveryMethod = useSetting('FEDERATION_Discovery_Method') as string;
	const setFederationDiscoveryMethod = useSettingSetValue('FEDERATION_Discovery_Method');

	const federationPublicKey = useSetting('FEDERATION_Public_Key') as string;

	// Form
	const discoveryOptions: SelectOption[] = [
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
	}, [currentStep, hasUnsavedChanges, domain, discoveryMethod, commit, onClose, setFederationDomain, setFederationDiscoveryMethod]);

	const previousStep = useCallback(() => {
		if (currentStep === 1) {
			onClose();
		} else {
			setCurrentStep(currentStep - 1);
		}
	}, [currentStep, onClose]);

	// Resolve DNS
	const resolvedSRVString = useSetting('FEDERATION_ResolvedSRV') as string;
	const resolvedSRV: Record<DNSRecordName, string | number> = JSON.parse(resolvedSRVString || '{}');

	const resolvedPublicKeyTXT = useSetting('FEDERATION_ResolvedPublicKeyTXT') as string;
	const resolvedProtocolTXT = useSetting('FEDERATION_ResolvedProtocolTXT') as string;

	const resolvedDNS: ResolvedDNS = {
		srv: resolvedSRV,
		txt: {
			[TXTRecordValue.PUBLIC_KEY]: resolvedPublicKeyTXT,
			[TXTRecordValue.PROTOCOL]: resolvedProtocolTXT,
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
									<Select width='250px' value={discoveryMethod || 'dns'} options={discoveryOptions} onChange={onChangeDiscoveryMethod} />
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
						<Tabs mi='neg-x24'>
							<Tabs.Item selected={currentTab === 1} onClick={(): void => setCurrentTab(1)}>
								{t('Federation_Configure_DNS')}
							</Tabs.Item>
							<Tabs.Item selected={currentTab === 2} onClick={(): void => setCurrentTab(2)}>
								{t('Federation_Legacy_support')}
							</Tabs.Item>
						</Tabs>
						<Box mbs='x24'>
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
									<Box mbe='x16'>
										<Box is='p' fontWeight='c2' fontSize='p2'>
											{t('Federation_SRV_no_support')}
										</Box>
										<Box is='p' mbs='x8' fontSize='x12'>
											{t('Federation_SRV_no_support_details')}
										</Box>
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
						<InviteUsers onClose={onClose} />
					</Modal.Content>
				</>
			)}
			<Modal.Footer justifyContent='space-between'>
				{currentStep === 2 && (
					<Box color='hint' fontSize='x12'>
						{t('Federation_DNS_info_update')}
					</Box>
				)}
				<Modal.FooterControllers>
					<Button onClick={previousStep}>{currentStep === 1 ? t('Cancel') : t('Back')}</Button>
					<Button primary onClick={nextStep}>
						{currentStep === 3 ? t('Finish') : t('Next')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};
