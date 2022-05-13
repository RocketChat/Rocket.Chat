import { Box, RadioButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo } from 'react';

const SharingOptions: FC<{
	isMonitor: boolean;
	isManager: boolean;
	scope: string;
	radioHandlers: any;
}> = ({ isMonitor, isManager, scope, radioHandlers: { setPublic, setPrivate, setDepartment } }) => {
	const t = useTranslation();

	return (
		<>
			<Box display='flex' mie='12px'>
				<RadioButton onChange={setPublic} disabled={isMonitor && !isManager} checked={scope === 'global'} />
				<Box mis='8px'>{t('Public')}</Box>
			</Box>
			<Box display='flex' mie='12px'>
				<RadioButton onChange={setDepartment} checked={scope === 'department'} />
				<Box mis='8px'>{t('Department')}</Box>
			</Box>
			<Box display='flex' mie='12px'>
				<RadioButton onChange={setPrivate} checked={scope === 'user'} />
				<Box mis='8px'>{t('Private')}</Box>
			</Box>
		</>
	);
};

export default memo(SharingOptions);
