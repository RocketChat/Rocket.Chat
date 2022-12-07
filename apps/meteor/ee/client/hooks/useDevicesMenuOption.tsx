import { Box, Icon } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React from 'react';

import DeviceSettingsModal from '../voip/modals/DeviceSettingsModal';
import { useHasLicenseModule } from './useHasLicenseModule';

type DevicesMenuOption = {
	type?: 'option' | 'heading' | 'divider';
	label?: ReactNode;
	action?: () => void;
};

export const useDevicesMenuOption = (): DevicesMenuOption | null => {
	const isEnterprise = useHasLicenseModule('voip-enterprise');
	const t = useTranslation();
	const setModal = useSetModal();

	const option = {
		label: (
			<Box alignItems='center' display='flex'>
				<Icon mie='x4' name='customize' size='x16' />
				{t('Device_settings')}
			</Box>
		),
		action: (): void => setModal(<DeviceSettingsModal />),
	};

	return isEnterprise ? option : null;
};
