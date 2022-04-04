import { Box, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement, memo, useEffect } from 'react';

import { usePresence } from '../../hooks/usePresence';

// TODO: deprecate this component
const StatusMessage = ({ uid }: { uid: string }): ReactElement | null => {
	const data = usePresence(uid);
	useEffect(() => {
		process.env.NODE_ENV === 'development' && console.warn('StatusMessage component is deprecated');
	}, [data]);

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
