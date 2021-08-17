import { Box, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement, memo } from 'react';

import { usePresence } from '../../hooks/usePresence';

const StatusMessage = ({ uid }: { uid: string }): ReactElement | null => {
	const data = usePresence(uid);

	if (!data || !data.statusText) {
		return null;
	}

	return (
		<Box title={data.statusText} justifyContent='center' display='flex'>
			<Icon name='balloon-text' size='x16' />
		</Box>
	);
};

export default memo(StatusMessage);
