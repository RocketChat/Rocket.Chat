import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement } from 'react';

const iconMap: Record<string, IconName> = {
	'browser': 'desktop',
	'mobile': 'mobile',
	'desktop-app': 'desktop',
	'mobile-app': 'mobile',
};

const DeviceIcon = ({ deviceType }: { deviceType: string }): ReactElement => (
	<Box
		is='span'
		display='inline-flex'
		alignItems='center'
		justifyContent='center'
		p={4}
		bg='selected'
		size='x24'
		borderRadius='full'
		mie={8}
	>
		<Icon name={iconMap[deviceType] || 'globe'} size='x16' color='hint' />
	</Box>
);

export default DeviceIcon;
