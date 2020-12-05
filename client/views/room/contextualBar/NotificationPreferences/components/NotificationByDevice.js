import React from 'react';
import { Box, Accordion, Icon, FieldGroup } from '@rocket.chat/fuselage';

export const NotificationByDevice = React.memo(({ device, icon, children }) => (
	<Accordion.Item title={<Box display='flex' alignItems='center'>
		<Icon name={icon} size='x18' />
		<Box fontScale='p2' mi='x16'>{device}</Box>
	</Box>}>
		<FieldGroup>
			{children}
		</FieldGroup>
	</Accordion.Item>
));
