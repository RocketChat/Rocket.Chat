import { Box, Icon, StatusBullet } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import { TextSeparator } from '@rocket.chat/ui-client';
import type { ComponentProps, ReactNode } from 'react';

export type WorkspaceCardTextSeparatorProps = {
	label: ReactNode;
	icon?: Keys;
	status?: ComponentProps<typeof StatusBullet>['status'];
	value: ReactNode;
};
const WorkspaceCardTextSeparator = ({ icon, label, value, status }: WorkspaceCardTextSeparatorProps) => (
	<TextSeparator
		label={
			<Box display='flex' alignItems='center' columnGap={icon ? 4 : undefined}>
				{icon && <Icon name={icon} size='x16' />}
				{status && (
					<Box minWidth='x16' display='inline-flex' flexDirection='row' alignItems='flex-end' justifyContent='center'>
						<StatusBullet status={status} />
					</Box>
				)}
				{label && label}
			</Box>
		}
		value={value}
	/>
);

export default WorkspaceCardTextSeparator;
