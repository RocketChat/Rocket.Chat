import { Box, Icon } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from './useHasLicenseModule';
import DeviceSettingsModal from '../voip/modals/DeviceSettingsModal';

type DevicesMenuOption = {
	type?: 'option' | 'heading' | 'divider';
	label?: ReactNode;
	action?: () => void;
};

export const useDevicesMenuOption = (): DevicesMenuOption | null => {
	const isEnterprise = useHasLicenseModule('voip-enterprise');
	const { t } = useTranslation();
	const setModal = useSetModal();

	const option = {
		label: (
			<Box alignItems='center' display='flex'>
				<Icon mie={4} name='customize' size='x16' />
				{t('Device_settings')}
			</Box>
		),
		action: (): void => setModal(<DeviceSettingsModal />),
	};

	return isEnterprise ? option : null;
};
