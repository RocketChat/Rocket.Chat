import { Box, Icon } from '@rocket.chat/fuselage';
import React, { ComponentProps, ReactElement } from 'react';

const iconMap: Record<string, ComponentProps<typeof Icon>['name']> = {
	browser: 'desktop',
	mobile: 'mobile',
};

const DeviceIcon = ({ deviceType }: { deviceType: string }): ReactElement => (
	<Box is='span' p='x4' bg='neutral-500-50' borderRadius='x32' mie='x4'>
		<Icon name={iconMap[deviceType]} size='x20' color='info' />
	</Box>
);

export default DeviceIcon;
