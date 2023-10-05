import { Box } from '@rocket.chat/fuselage';
import { MessageComposerSkeleton } from '@rocket.chat/ui-composer';
import React from 'react';

const ComposerSkeleton = () => {
	return (
		<>
			<MessageComposerSkeleton />
			<Box height='x24' />
		</>
	);
};

export default ComposerSkeleton;
