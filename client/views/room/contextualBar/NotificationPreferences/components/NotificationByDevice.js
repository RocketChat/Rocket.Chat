import { Box, Accordion, Icon, FieldGroup } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

export const NotificationByDevice = ({ device, icon, children }) => (
	<Accordion.Item
		title={
			<Box display='flex' alignItems='center'>
				<Icon name={icon} size='x18' />
				<Box fontScale='p2m' mi='x16'>
					{device}
				</Box>
			</Box>
		}
	>
		<FieldGroup>{children}</FieldGroup>
	</Accordion.Item>
);

export default memo(NotificationByDevice);
