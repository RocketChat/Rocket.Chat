import { Box, Icon } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactNode } from 'react';

import DeviceSettingsModal from '../voip/modals/DeviceSettingsModal';
import { useHasLicense } from './useHasLicense';

type DevicesMenuOption = {
	type?: 'option' | 'heading' | 'divider';
	label?: ReactNode;
	action?: () => void;
};

export const useDevicesMenuOption = (): DevicesMenuOption | null => {
	// After Pull, change to correct license
	const isEnterprise = useHasLicense('livechat-enterprise');
	const t = useTranslation();
	const setModal = useSetModal();
	console.log(isEnterprise);

	const option = {
		label: (
			<Box alignItems='center' display='flex'>
				<Icon mie='x4' name='settings' size='x16' />
				{t('Device_settings')}
			</Box>
		),
		action: (): void => setModal(<DeviceSettingsModal />),
	};

	return isEnterprise ? option : null;
};
