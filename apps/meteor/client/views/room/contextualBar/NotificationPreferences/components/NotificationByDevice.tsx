import { AccordionItem, Icon, FieldGroup, Stack, Text } from '@rocket.chat/fuselage';
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
			<Stack direction='row' align='center' gap='x16'>
				<Icon name={icon} size='x18' />
				<Text fontScale='p2m'>{device}</Text>
			</Stack>
		}
	>
		<FieldGroup>{children}</FieldGroup>
	</AccordionItem>
);

export default memo(NotificationByDevice);
