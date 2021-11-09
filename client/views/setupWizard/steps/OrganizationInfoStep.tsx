import { OrganizationInfoPage } from '@rocket.chat/onboarding-ui';
import React, { useEffect, useReducer, useState, useCallback, useMemo } from 'react';

import { useSettingsDispatch } from '../../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation, useLanguages } from '../../../contexts/TranslationContext';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const useFields = () => {
	const reset = 'RESET';
	const setValue = 'SET_VALUE';

	const [fields, dispatch] = useReducer((fields, { type, payload }) => {
		if (type === reset) {
			return payload;
		}

		if (type === setValue) {
			const { _id, value } = payload;
			return fields.map((field) => (field._id === _id ? { ...field, value } : field));
		}

		return fields;
	}, []);

	const resetFields = useCallback((fields) => dispatch({ type: reset, payload: fields }), []);
	const setFieldValue = useCallback(
		(_id, value) => dispatch({ type: setValue, payload: { _id, value } }),
		[],
	);

	return { fields, resetFields, setFieldValue };
};

const organizationTypeOptions = [
	['community', 'Community'],
	['enterprise', 'Enterprise'],
	['government', 'Government'],
	['nonprofit', 'Nonprofit'],
];

const organizationIndustryOptions = [
	['aerospaceDefense', 'Aerospace and Defense'],
	['blockchain', 'Blockchain'],
	['consulting', 'Consulting'],
	['consumerGoods', 'Consumer Packaged Goods'],
	['contactCenter', 'Contact Center'],
	['education', 'Education'],
	['entertainment', 'Entertainment'],
	['financialServices', 'Financial Services'],
	['gaming', 'Gaming'],
	['healthcare', 'Healthcare'],
	['hospitalityBusinness', 'Hospitality Businness'],
	['insurance', 'Insurance'],
	['itSecurity', 'IT Security'],
	['logistics', 'Logistics'],
	['manufacturing', 'Manufacturing'],
	['media', 'Media'],
	['pharmaceutical', 'Pharmaceutical'],
	['realEstate', 'Real Estate'],
	['religious', 'Religious'],
	['retail', 'Retail'],
	['socialNetwork', 'Social Network'],
	['technologyProvider', 'Technology Provider'],
	['technologyServices', 'Technology Services'],
	['telecom', 'Telecom'],
	['utilities', 'Utilities'],
	['other', 'Other'],
];

const organizationSizeOptions = [
	['0', '1-10 people'],
	['1', '11-50 people'],
	['2', '51-100 people'],
	['3', '101-250 people'],
	['4', '251-500 people'],
	['5', '501-1000 people'],
	['6', '1001-4000 people'],
	['7', '4001 or more people'],
];

// const countryOptions = [
// 	...Object.entries(countries).map<readonly [string, string]>(([code, { name }]) => [code, name]),
// 	['worldwide', 'Worldwide'],
// ];

type OrganizationInfoStepProps = {
	step: number;
};

const OrganizationInfoStep = ({ step }: OrganizationInfoStepProps): ReactElement => {
	// const t = useTranslation();
	// const autoFocusRef = useAutoFocus(active);
	const dispatchSettings = useSettingsDispatch();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		setupWizardData: { organizationData },
		setSetupWizardData,
		settings,
		currentStep,
		goToPreviousStep,
		goToNextStep,
	} = useSetupWizardContext();

	const { fields, resetFields, setFieldValue } = useFields();
	const [commiting, setCommiting] = useState(false);

	const languages = useLanguages();

	useEffect(() => {
		resetFields(
			settings
				.filter(({ wizard }) => wizard.step === step)
				.filter(({ type }) => ['string', 'select', 'language', 'boolean'].includes(type))
				.sort(({ wizard: { order: a } }, { wizard: { order: b } }) => a - b)
				.map(({ value, ...field }) => ({ ...field, value: value != null ? value : '' })),
		);
	}, [settings, currentStep, step, resetFields]);

	const handleBackClick = (): void => {
		goToPreviousStep();
	};

	const handleSubmit = async (data) => {
		// event.preventDefault();
		setCommiting(true);
		setSetupWizardData((prevState) => ({ ...prevState, organizationData: data }));
		goToNextStep();

		// try {
		// 	await dispatchSettings(fields.map(({ _id, value }) => ({ _id, value })));
		// 	goToNextStep();
		// } catch (error) {
		// 	dispatchToastMessage({ type: 'error', message: error });
		// } finally {
		// 	setCommiting(false);
		// }
	};

	// const hasEmptyRequiredFields = useMemo(
	// 	() => !!fields.find((field) => field.requiredOnWizard && String(field.value).trim() === ''),
	// 	[fields],
	// );

	// if (fields.length === 0) {
	// 	return (
	// 		<Step active={active} working={commiting} onSubmit={handleSubmit}>
	// 			<StepHeader number={step} title={title} />

	// 			<Margins blockEnd='x32'>
	// 				<FieldGroup>
	// 					{Array.from({ length: 5 }, (_, i) => (
	// 						<Field key={i}>
	// 							<Flex.Item align='stretch'>
	// 								<Field.Label>{<Skeleton width='50%' />}</Field.Label>
	// 							</Flex.Item>
	// 							<InputBox.Skeleton />
	// 						</Field>
	// 					))}
	// 				</FieldGroup>
	// 			</Margins>
	// 		</Step>
	// 	);
	// }

	// return (
	// 	<Step active={active} working={commiting} onSubmit={handleSubmit}>
	// 		<StepHeader number={step} title={title} />

	// 		<Margins blockEnd='x32'>
	// 			<FieldGroup>
	// 				{fields.map(({ _id, type, i18nLabel, value, values, requiredOnWizard }, i) => (
	// 					<Field key={i}>
	// 						<Field.Label htmlFor={_id} required={requiredOnWizard}>
	// 							{t(i18nLabel)}
	// 						</Field.Label>
	// 						<Field.Row>
	// 							{type === 'string' && (
	// 								<TextInput
	// 									type='text'
	// 									data-qa={_id}
	// 									id={_id}
	// 									name={_id}
	// 									ref={i === 0 ? autoFocusRef : undefined}
	// 									value={value}
	// 									onChange={({ currentTarget: { value } }) => setFieldValue(_id, value)}
	// 								/>
	// 							)}

	// 							{type === 'select' && (
	// 								<Select
	// 									data-qa={_id}
	// 									id={_id}
	// 									name={_id}
	// 									placeholder={t('Select_an_option')}
	// 									value={value}
	// 									onChange={(value) => setFieldValue(_id, value)}
	// 									options={values.map(({ i18nLabel, key }) => [key, t(i18nLabel)])}
	// 								/>
	// 							)}

	// 							{type === 'boolean' && (
	// 								<Select
	// 									data-qa={_id}
	// 									id={_id}
	// 									name={_id}
	// 									ref={i === 0 ? autoFocusRef : undefined}
	// 									value={String(value)}
	// 									onChange={(value) => setFieldValue(_id, value === 'true')}
	// 									options={[
	// 										['true', t('Yes')],
	// 										['false', t('No')],
	// 									]}
	// 								/>
	// 							)}

	// 							{type === 'language' && (
	// 								<Select
	// 									data-qa={_id}
	// 									id={_id}
	// 									name={_id}
	// 									placeholder={t('Default')}
	// 									value={value}
	// 									onChange={(value) => setFieldValue(_id, value)}
	// 									options={languages.map(({ key, name }) => [key, name])}
	// 								/>
	// 							)}
	// 						</Field.Row>
	// 					</Field>
	// 				))}
	// 			</FieldGroup>
	// 		</Margins>

	// 		<Pager
	// 			disabled={commiting}
	// 			isContinueEnabled={!hasEmptyRequiredFields}
	// 			onBackClick={currentStep > 2 && handleBackClick}
	// 		/>
	// 	</Step>
	// );

	return (
		<OrganizationInfoPage
			initialValues={organizationData}
			onSubmit={handleSubmit}
			onBackButtonClick={handleBackClick}
			currentStep={step}
			organizationTypeOptions={organizationTypeOptions}
			organizationIndustryOptions={organizationIndustryOptions}
			organizationSizeOptions={organizationSizeOptions}
		/>
	);
};

export default OrganizationInfoStep;
