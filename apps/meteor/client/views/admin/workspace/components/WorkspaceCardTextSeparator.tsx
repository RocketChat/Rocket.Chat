import { Box, Icon, StatusBullet } from '@rocket.chat/fuselage';
import { TextSeparator } from '@rocket.chat/ui-client';
import type { ComponentProps, ReactNode } from 'react';
import React from 'react';

type WorkspaceCardTextSeparatorProps = {
	label: ReactNode;
	icon?: ComponentProps<typeof Icon>['name'];
	status?: ComponentProps<typeof StatusBullet>['status'];
	value: ReactNode;
};
const WorkspaceCardTextSeparator = ({ icon, label, value, status }: WorkspaceCardTextSeparatorProps) => (
	<TextSeparator
		label={
			<>
				{icon && <Icon name={icon} size='x16' mie={4} />}
				{status && (
					<Box minWidth='x16' display='inline-flex' flexDirection='row' alignItems='flex-end' justifyContent='center'>
						<StatusBullet status={status} />
					</Box>
				)}
				{label && label}
			</>
		}
		value={value}
	/>
);

export default WorkspaceCardTextSeparator;
