import {
	Field,
	FieldGroup,
	InputBox,
	Label,
	Margins,
	SelectInput,
	Skeleton,
	TextInput,
} from '@rocket.chat/fuselage';
import React, { useEffect, useReducer, useState } from 'react';

import { useBatchSettingsDispatch } from '../../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation, useLanguages } from '../../../contexts/TranslationContext';
import { useFocus } from '../../../hooks/useFocus';
import { Pager } from '../Pager';
import { useSetupWizardContext } from '../SetupWizardState';
import { Step } from '../Step';
import { StepHeader } from '../StepHeader';

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

export function SettingsBasedStep({ step, title, active }) {
	const { settings, currentStep, goToPreviousStep, goToNextStep } = useSetupWizardContext();
	const { fields, resetFields, setFieldValue } = useFields();
	const [commiting, setCommiting] = useState(false);

	const languages = useLanguages();

	useEffect(() => {
		resetFields(
			settings
				.filter(({ wizard }) => wizard.step === step)
				.filter(({ type }) => ['string', 'select', 'language'].includes(type))
				.sort(({ wizard: { order: a } }, { wizard: { order: b } }) => a - b)
				.map(({ value, ...field }) => ({ ...field, value: value || '' })),
		);
	}, [settings, currentStep]);

	const t = useTranslation();

	const batchSetSettings = useBatchSettingsDispatch();

	const autoFocusRef = useFocus(active);

	const dispatchToastMessage = useToastMessageDispatch();

	const handleBackClick = () => {
		goToPreviousStep();
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		setCommiting(true);

		try {
			await batchSetSettings(fields.map(({ _id, value }) => ({ _id, value })));
			goToNextStep();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setCommiting(false);
		}
	};

	if (fields.length === 0) {
		return <Step active={active} working={commiting} onSubmit={handleSubmit}>
			<StepHeader number={step} title={title} />

			<Margins blockEnd='32'>
				<FieldGroup>
					{Array.from({ length: 5 }, (_, i) => <Field key={i}>
						<Label text={<Skeleton />} />
						<InputBox.Skeleton />
					</Field>)}
				</FieldGroup>
			</Margins>
		</Step>;
	}

	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='32'>
			<FieldGroup>
				{fields.map(({ _id, type, i18nLabel, value, values }, i) =>
					<Field key={i}>
						<Label text={t(i18nLabel)} />
						{type === 'string' && <TextInput
							type='text'
							name={_id}
							ref={i === 0 ? autoFocusRef : undefined}
							value={value}
							onChange={({ currentTarget: { value } }) => setFieldValue(_id, value)}
						/>}

						{type === 'select' && <SelectInput
							type='select'
							name={_id}
							placeholder={t('Select_an_option')}
							ref={i === 0 ? autoFocusRef : undefined}
							value={value}
							onChange={({ currentTarget: { value } }) => setFieldValue(_id, value)}
						>
							{values
								.map(({ i18nLabel, key }) => ({ label: t(i18nLabel), value: key }))
								.map(({ label, value }) => <SelectInput.Option key={value} value={value}>{label}</SelectInput.Option>)}
						</SelectInput>}

						{type === 'language' && <SelectInput
							type='select'
							name={_id}
							placeholder={t('Default')}
							ref={i === 0 ? autoFocusRef : undefined}
							value={value}
							onChange={({ currentTarget: { value } }) => setFieldValue(_id, value)}
						>
							{Object.entries(languages)
								.map(([key, { name }]) => ({ label: name, value: key }))
								.sort((a, b) => a.key - b.key)
								.map(({ label, value }) => <SelectInput.Option key={value} value={value}>{label}</SelectInput.Option>)}
						</SelectInput>}
					</Field>,
				)}
			</FieldGroup>
		</Margins>

		<Pager
			disabled={commiting}
			onBackClick={currentStep > 2 && handleBackClick}
		/>
	</Step>;
}
