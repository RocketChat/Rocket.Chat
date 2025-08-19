import { Box, AccordionItem, Icon, FieldGroup } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement, ReactNode } from 'react';
import { memo } from 'react';

type NotificationByDeviceProps = {
	device: string;
	icon: IconName;
	children: ReactNode;
};

const NotificationByDevice = ({ device, icon, children }: NotificationByDeviceProps): ReactElement => (
	<AccordionItem
		title={
			<Box display='flex' alignItems='center'>
				<Icon name={icon} size='x18' />
				<Box fontScale='p2m' mi={16}>
					{device}
				</Box>
			</Box>
		}
	>
		<FieldGroup>{children}</FieldGroup>
	</AccordionItem>
);

export default memo(NotificationByDevice);
