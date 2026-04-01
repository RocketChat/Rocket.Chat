import { Field, FieldGroup, FieldHint, FieldLabel, FieldRow, ToggleSwitch } from '@rocket.chat/fuselage-forms';
import type { ReactElement } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const PreferencesGeneral = (): ReactElement => {
	const { t } = useTranslation();
	const { control } = useFormContext();

	return (
		<FieldGroup marginBlockEnd='1.5rem' paddingInline='0.5rem'>
			<Field>
				<FieldRow>
					<FieldLabel>{t('Omnichannel_hide_conversation_after_closing')}</FieldLabel>
					<Controller
						control={control}
						name='omnichannelHideConversationAfterClosing'
						render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
					/>
				</FieldRow>
				<FieldHint>{t('Omnichannel_hide_conversation_after_closing_description')}</FieldHint>
			</Field>
		</FieldGroup>
	);
};
