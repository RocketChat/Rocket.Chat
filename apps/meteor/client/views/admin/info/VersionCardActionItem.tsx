import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

export type ActionItem = {
	type: 'danger' | 'info';
	icon: 'check' | 'warning';
	label: ReactElement;
};

type VersionCardActionItemProps = {
	actionItem: ActionItem;
	key: number;
};

const VersionCardActionItem = ({ key, actionItem }: VersionCardActionItemProps): ReactElement => {
	return (
		<Box
			key={key}
			display='flex'
			alignItems='center'
			color={actionItem.type === 'danger' ? 'status-font-on-danger' : 'secondary-info'}
			fontScale='p2m'
			mbe={4}
		>
			<Icon
				name={actionItem.icon}
				size={20}
				bg={actionItem.type === 'danger' ? 'status-background-danger' : 'surface-tint'}
				p={4}
				borderRadius={4}
				mie={12}
			/>
			<Box>{actionItem.label}</Box>
		</Box>
	);
};

export default memo(VersionCardActionItem);
