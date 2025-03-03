import { Field, FieldGroup, FieldHint, FieldLabel, FieldRow, ToggleSwitch } from '@rocket.chat/fuselage';
import { useId } from 'react';
import type { ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const PreferencesGeneral = (): ReactElement => {
	const { t } = useTranslation();
	const { register } = useFormContext();
	const omnichannelHideAfterClosing = useId();

	return (
		<FieldGroup marginBlockEnd='1.5rem' paddingInline='0.5rem'>
			<Field>
				<FieldRow>
					<FieldLabel htmlFor={omnichannelHideAfterClosing}>{t('Omnichannel_hide_conversation_after_closing')}</FieldLabel>
					<ToggleSwitch id={omnichannelHideAfterClosing} {...register('omnichannelHideConversationAfterClosing')} />
				</FieldRow>
				<FieldHint>{t('Omnichannel_hide_conversation_after_closing_description')}</FieldHint>
			</Field>
		</FieldGroup>
	);
};
