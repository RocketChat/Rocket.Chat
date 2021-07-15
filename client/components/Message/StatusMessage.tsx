import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { useUserData } from '../../hooks/useUserData';

const StatusMessage: FC<{ uid: string }> = ({ uid }) => {
	const data = useUserData(uid);

	if (!data || !data.statusText) {
		return null;
	}

	return (
		<Box title={data.statusText}>
			<Icon name='balloon-text' />
		</Box>
	);
};

export default memo(StatusMessage);
