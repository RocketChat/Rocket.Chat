import { Box, AccordionItem, Icon, FieldGroup, Stack } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactNode } from 'react';
import { memo } from 'react';

export type NotificationByDeviceProps = {
	device: string;
	icon: IconName;
	children: ReactNode;
};

const NotificationByDevice = ({ device, icon, children }: NotificationByDeviceProps) => (
	<AccordionItem
		title={
			<Box display='flex' alignItems='center'>
				<Icon name={icon} size='x18' />
				<Box fontScale='p2m' marginInline='x16'>
					{device}
				</Box>
			</Box>
		}
	>
		<FieldGroup>
			<Stack gap='x16'>{children}</Stack>
		</FieldGroup>
	</AccordionItem>
);

export default memo(NotificationByDevice);
