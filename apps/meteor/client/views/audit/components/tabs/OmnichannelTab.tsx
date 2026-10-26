import { Box, Field, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import type { UseFormReturn } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AutoCompleteAgent from '../../../omnichannel/components/AutoCompleteAgent';
import type { AuditFields } from '../../hooks/useAuditForm';
import VisitorAutoComplete from '../forms/VisitorAutoComplete';

export type OmnichannelTabProps = {
	form: UseFormReturn<AuditFields>;
};

const OmnichannelTab = ({ form: { control } }: OmnichannelTabProps) => {
	const { t } = useTranslation();

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
			<Box width='full'>
				<Field>
					<FieldLabel>{t('Visitor')}</FieldLabel>
					<FieldRow>
						<VisitorAutoComplete
							value={visitorField.value}
							error={!!visitorFieldState.error}
							onChange={visitorField.onChange}
							placeholder={t('Username_Placeholder')}
						/>
					</FieldRow>
					{visitorFieldState.error?.type === 'required' && <FieldError>{t('Required_field', { field: t('Visitor') })}</FieldError>}
					{visitorFieldState.error?.type === 'validate' && <FieldError>{visitorFieldState.error.message}</FieldError>}
				</Field>
			</Box>
			<Box width='full'>
				<Field>
					<FieldLabel>{t('Agent')}</FieldLabel>
					<FieldRow>
						<AutoCompleteAgent
							error={(() => {
								if (agentFieldState.error?.type === 'required') {
									return t('Required_field', { field: t('Agent') });
								}

								return agentFieldState.error?.message;
							})()}
							value={agentField.value}
							onChange={agentField.onChange}
							placeholder={t('Username_Placeholder')}
						/>
					</FieldRow>
					{agentFieldState.error?.type === 'required' && <FieldError>{t('Required_field', { field: t('Agent') })}</FieldError>}
					{agentFieldState.error?.type === 'validate' && <FieldError>{agentFieldState.error.message}</FieldError>}
				</Field>
			</Box>
		</>
	);
};

export default OmnichannelTab;
