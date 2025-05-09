/* eslint-disable react/no-multi-comp */
import { IconButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { ComponentProps, Ref } from 'react';
import { forwardRef } from 'react';

import { useVoipDeviceSettings } from './hooks/useVoipDeviceSettings';

const CustomizeButton = forwardRef(function CustomizeButton(
	{ mini, ...props }: ComponentProps<typeof IconButton>,
	ref: Ref<HTMLButtonElement>,
) {
	const size = mini ? 24 : 32;
	return <IconButton {...props} ref={ref} icon='customize' mini width={size} height={size} />;
});

const VoipSettingsButton = ({ mini = false }: { mini?: boolean }) => {
	const menu = useVoipDeviceSettings();

	return (
		<GenericMenu
			is={CustomizeButton}
			title={menu.title}
			disabled={menu.disabled}
			sections={menu.sections}
			selectionMode='multiple'
			placement='top-end'
			icon='customize'
			mini={mini}
		/>
	);
};

export default VoipSettingsButton;
