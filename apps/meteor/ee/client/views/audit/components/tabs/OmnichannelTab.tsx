import { Field } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useController } from 'react-hook-form';

import AutoCompleteAgent from '../../../../../../client/components/AutoCompleteAgent';
import type { AuditFields } from '../../hooks/useAuditForm';
import VisitorAutoComplete from '../forms/VisitorAutoComplete';

type OmnichannelTabProps = {
	form: UseFormReturn<AuditFields>;
};

const OmnichannelTab = ({ form: { control } }: OmnichannelTabProps): ReactElement => {
	const t = useTranslation();

	const { field: visitorField, fieldState: visitorFieldState } = useController({
		name: 'visitor',
		control,
		rules: { required: true },
	});
	const { field: agentField, fieldState: agentFieldState } = useController({
		name: 'agent',
		control,
		rules: { required: true },
	});

	return (
		<>
			<Field flexShrink={1}>
				<Field.Label flexGrow={0}>{t('Visitor')}</Field.Label>
				<Field.Row>
					<VisitorAutoComplete
						value={visitorField.value}
						error={!!visitorFieldState.error}
						onChange={visitorField.onChange}
						placeholder={t('Username_Placeholder')}
					/>
				</Field.Row>
				{visitorFieldState.error?.type === 'required' && <Field.Error>{t('The_field_is_required', t('Visitor'))}</Field.Error>}
				{visitorFieldState.error?.type === 'validate' && <Field.Error>{visitorFieldState.error.message}</Field.Error>}
			</Field>
			<Field flexShrink={1} marginInlineStart={8}>
				<Field.Label flexGrow={0}>{t('Agent')}</Field.Label>
				<Field.Row>
					<AutoCompleteAgent
						error={(() => {
							if (agentFieldState.error?.type === 'required') {
								return t('The_field_is_required', t('Agent'));
							}

							return agentFieldState.error?.message;
						})()}
						value={agentField.value}
						onChange={agentField.onChange}
						placeholder={t('Username_Placeholder')}
					/>
				</Field.Row>
				{agentFieldState.error?.type === 'required' && <Field.Error>{t('The_field_is_required', t('Agent'))}</Field.Error>}
				{agentFieldState.error?.type === 'validate' && <Field.Error>{agentFieldState.error.message}</Field.Error>}
			</Field>
		</>
	);
};

export default OmnichannelTab;
