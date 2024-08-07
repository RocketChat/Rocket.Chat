import { Box } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { VoiceCallSession } from '../../../../../contexts/VoiceCallContext';

export const VoiceCallStatus = ({ session }: { session: VoiceCallSession }) => {
	const { t } = useTranslation();
	const { held = false, muted = false } = session || {};

	if (!held && !muted) {
		return null;
	}

	return (
		<Box is='section' display='flex' justifyContent='space-between' paddingInline={12}>
			{held && (
				<Box is='span' color='font-default'>
					{t('On_Hold')}
				</Box>
			)}

			{muted && (
				<Box is='span' color='status-font-on-warning'>
					{t('Muted')}
				</Box>
			)}
		</Box>
	);
};

export default VoiceCallStatus;
