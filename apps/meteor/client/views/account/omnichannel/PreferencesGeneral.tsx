import { Field, FieldGroup, FieldHint, FieldLabel, FieldRow, ToggleSwitch } from '@rocket.chat/fuselage-forms';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import PreferencesInsetSection from './layout/PreferencesInsetSection';

export const PreferencesGeneral = () => {
	const { t } = useTranslation();
	const { control } = useFormContext();

	return (
		<PreferencesInsetSection>
			<FieldGroup>
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
		</PreferencesInsetSection>
	);
};
