import {
	Modal,
	Box,
	Field,
	TextInput,
	Select,
	ButtonGroup,
	Button,
	FieldGroup,
} from '@rocket.chat/fuselage';
import React, { FormEvent, useCallback, useState } from 'react';
import _ from 'underscore';

import { ISetting } from '../../../../../../definition/ISetting';
import { useSetting, useSettingSetValue } from '../../../../../contexts/SettingsContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';

const debounced = <T extends ISetting['value']>(setter: (value: T) => Promise<void>) =>
	_.debounce((e: FormEvent<HTMLOrSVGElement> | string) => {
		const value = typeof e === 'string' ? e : e.target.value;
		setter(value);
	}, 300);

const FederationModal = ({ onClose, ...props }) => {
	const t = useTranslation();

	const [currentStep, setCurrentStep] = useState(1);

	const federationDomain = useSetting('FEDERATION_Domain') as string;
	const setFederationDomain = useSettingSetValue('FEDERATION_Domain');

	const federationDiscoveryMethod = useSetting('FEDERATION_Discovery_Method') as string;
	const setFederationDiscoveryMethod = useSettingSetValue('FEDERATION_Discovery_Method');

	const discoveryOptions = [
		['dns', 'DNS (recommended)'],
		['hub', 'HUB'],
	];

	const nextStep = useCallback(() => {
		if (currentStep === 3) {
			console.log('submit');
		} else {
			setCurrentStep(currentStep + 1);
		}
	}, [currentStep]);

	const previousStep = useCallback(() => {
		if (currentStep === 1) {
			onClose();
		} else {
			setCurrentStep(currentStep - 1);
		}
	}, [currentStep]);

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
									<TextInput
										placeholder='@rocket.chat'
										value={federationDomain}
										onChange={debounced(setFederationDomain)}
									/>
								</Field.Row>
							</Field>
							<Field>
								<Field.Label>{t('Federation_Discovery_method')}</Field.Label>
								<Field.Description>{t('Federation_Discovery_method_details')}</Field.Description>
								<Field.Row>
									<Select
										width='250px'
										value={federationDiscoveryMethod || 'dns'}
										options={discoveryOptions}
										onChange={debounced(setFederationDiscoveryMethod)}
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
						<Box display='flex' flexDirection='column' alignItems='stretch' flexGrow={1}>
							2
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
