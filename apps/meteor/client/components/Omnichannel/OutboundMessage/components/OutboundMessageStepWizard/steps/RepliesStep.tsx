import type { Serialized } from '@rocket.chat/core-typings';
import { Field, FieldGroup, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ILivechatContactWithManagerData } from '@rocket.chat/rest-typings';
import { useId } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AutoCompleteAgent from '../../../../../AutoCompleteAgent';
import AutoCompleteDepartment from '../../../../../AutoCompleteDepartment';
import { StepsWizardContent } from '../../../../../StepsWizard';

type RecipientFormData = {
	contact: Serialized<ILivechatContactWithManagerData>;
	channel: string;
	to: string;
	from: string;
};

const RepliesStep = () => {
	const { t } = useTranslation();
	const repliesId = useId();

	const { handleSubmit, getValues } = useFormContext<RecipientFormData>();

	const handleStepValidation = useEffectEvent(async () => {
		const { contact, channel, from, to } = getValues();
		return !!contact && !!channel && !!from && !!to;
	});

	const onSubmit = () => {
		console.log('submited replies');
	};

	const departmentField = useWatch({ name: 'department' });

	return (
		<StepsWizardContent title='Replies' validate={handleStepValidation}>
			<form id={repliesId} onSubmit={handleSubmit(onSubmit)}>
				<FieldGroup>
					<Field>
						<FieldLabel id={`${repliesId}-department`}>{t('Department_optional')}</FieldLabel>
						<FieldRow>
							<Controller
								name='department'
								render={({ field }) => (
									<AutoCompleteDepartment aria-labelledby={`${repliesId}-department`} value={field.value} onChange={field.onChange} />
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={`${repliesId}-agent`}>{t('Agent_optional')}</FieldLabel>
						<FieldRow>
							<Controller
								name='agent'
								render={({ field }) => (
									<AutoCompleteAgent id={`${repliesId}-agent`} disabled={!departmentField} value={field.value} onChange={field.onChange} />
								)}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</form>
		</StepsWizardContent>
	);
};

export default RepliesStep;
