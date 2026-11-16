import { Icon, Stack, StatusBullet } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import { TextSeparator } from '@rocket.chat/ui-client';
import type { ComponentProps, ReactNode } from 'react';

import StatusBulletSlot from '../layout/StatusBulletSlot';

export type WorkspaceCardTextSeparatorProps = {
	label: ReactNode;
	icon?: Keys;
	status?: ComponentProps<typeof StatusBullet>['status'];
	value: ReactNode;
};
const WorkspaceCardTextSeparator = ({ icon, label, value, status }: WorkspaceCardTextSeparatorProps) => (
	<TextSeparator
		label={
			<Stack direction='row' align='center' gap={icon ? 'x4' : undefined}>
				{icon && <Icon name={icon} size='x16' />}
				{status && (
					<StatusBulletSlot>
						<StatusBullet status={status} />
					</StatusBulletSlot>
				)}
				{label && label}
			</Stack>
		}
		value={value}
	/>
);

export default WorkspaceCardTextSeparator;
