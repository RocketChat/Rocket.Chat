/* eslint-disable react/no-multi-comp */
import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, Ref } from 'react';
import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import GenericMenu from '../../../../../components/GenericMenu/GenericMenu';
import useVoiceCallSettingsMenu from '../../../../../hooks/voiceCall/useVoiceCallDeviceSettings';

const CustomizeButton = forwardRef(function CustomizeButton(
	{ mini, ...props }: ComponentProps<typeof IconButton>,
	ref: Ref<HTMLButtonElement>,
) {
	const size = mini ? 24 : 32;
	return <IconButton {...props} ref={ref} icon='customize' mini width={size} height={size} />;
});

const VoiceCallSettingsButton = ({ mini = false }: { mini?: boolean }) => {
	const { t } = useTranslation();
	const sections = useVoiceCallSettingsMenu();

	return (
		<GenericMenu
			is={CustomizeButton}
			title={t('Device_settings')}
			sections={sections}
			selectionMode='multiple'
			placement='top-end'
			icon='customize'
			mini={mini}
		/>
	);
};

export default VoiceCallSettingsButton;
