import { TAPi18n } from 'meteor/tap:i18n';
import React, { Fragment, useEffect, useReducer, useState } from 'react';

import { handleError } from '../../../../app/utils/client';
import { useTranslation } from '../../../hooks/useTranslation';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { Input } from '../../basic/Input';
import { Pager } from '../Pager';
import { useSetupWizardParameters } from '../ParametersProvider';
import { useSetupWizardStepsState } from '../StepsState';
import { Step } from '../Step';
import { StepHeader } from '../StepHeader';
import { StepContent } from '../StepContent';
import { batchSetSettings } from '../functions';

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

	const resetFields = (fields) => dispatch({ type: reset, payload: fields });
	const setFieldValue = (_id, value) => dispatch({ type: setValue, payload: { _id, value } });

	return { fields, resetFields, setFieldValue };
};

export function SettingsBasedStep({ step, title }) {
	const { settings } = useSetupWizardParameters();
	const { currentStep, goToPreviousStep, goToNextStep } = useSetupWizardStepsState();
	const { fields, resetFields, setFieldValue } = useFields();
	const [commiting, setCommiting] = useState(false);

	const active = step === currentStep;

	const languages = useReactiveValue(() => TAPi18n.getLanguages(), []);

	useEffect(() => {
		resetFields(
			settings
				.filter(({ wizard: { step } }) => step === currentStep)
				.filter(({ type }) => ['string', 'select', 'language'].includes(type))
				.sort(({ wizard: { order: a } }, { wizard: { order: b } }) => a - b)
				.map(({ value, ...field }) => ({ ...field, value: value || '' }))
		);
	}, [settings, currentStep]);

	const t = useTranslation();

	const handleBackClick = () => {
		goToPreviousStep();
	};

	const handleContinueClick = async () => {
		setCommiting(true);

		try {
			await batchSetSettings(fields.map(({ _id, value }) => ({ _id, value })));
			goToNextStep();
		} catch (error) {
			console.error(error);
			handleError(error);
		} finally {
			setCommiting(false);
		}
	};

	return <Step active={active} working={commiting}>
		<StepHeader number={step} title={title} />

		<StepContent>
			{fields.map(({ _id, type, i18nLabel, value, values }, i) =>
				<Fragment key={i}>
					{type === 'string'
					&& <Input
						type='text'
						title={t(i18nLabel)}
						name={_id}
						value={value}
						onChange={({ currentTarget: { value } }) => setFieldValue(_id, value)}
					/>}

					{type === 'select'
					&& <Input
						type='select'
						title={t(i18nLabel)}
						name={_id}
						placeholder={t('Select_an_option')}
						options={values.map(({ i18nLabel, key }) => ({ label: t(i18nLabel), value: key }))}
						value={value}
						onChange={({ currentTarget: { value } }) => setFieldValue(_id, value)}
					/>}

					{type === 'language'
					&& <Input
						type='select'
						title={t(i18nLabel)}
						name={_id}
						placeholder={t('Default')}
						options={Object.entries(languages)
							.map(([key, { name }]) => ({ label: name, value: key }))
							.sort((a, b) => a.key - b.key)}
						value={value}
						onChange={({ currentTarget: { value } }) => setFieldValue(_id, value)}
					/>}
				</Fragment>
			)}
		</StepContent>

		<Pager
			disabled={commiting}
			onBackClick={currentStep > 2 && handleBackClick}
			onContinueClick={handleContinueClick}
		/>
	</Step>;
}
