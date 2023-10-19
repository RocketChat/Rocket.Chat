import { Box, Field, FieldGroup, FieldHint, FieldLabel, FieldRow, ToggleSwitch } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { useFormContext } from 'react-hook-form';

export const PreferencesGeneral = (): ReactElement => {
	const t = useTranslation();
	const { register } = useFormContext();
	const omnichannelHideAfterClosing = useUniqueId();

	return (
		<FieldGroup marginBlockEnd='1.5rem' paddingInline='0.5rem'>
			<Field>
				<Box display='flex' alignItems='center' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<FieldLabel htmlFor={omnichannelHideAfterClosing}>{t('Omnichannel_hide_conversation_after_closing')}</FieldLabel>
					<FieldRow>
						<ToggleSwitch id={omnichannelHideAfterClosing} {...register('omnichannelHideConversationAfterClosing')} />
					</FieldRow>
				</Box>
				<FieldHint>{t('Omnichannel_hide_conversation_after_closing_description')}</FieldHint>
			</Field>
		</FieldGroup>
	);
};
