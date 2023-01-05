import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

const iconMap: Record<string, ComponentProps<typeof Icon>['name']> = {
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
		p='x4'
		bg='neutral-500-50'
		size='x24'
		borderRadius='full'
		mie='x8'
	>
		<Icon name={iconMap[deviceType] || 'globe'} size='x16' color='hint' />
	</Box>
);

export default DeviceIcon;
