import { Box, Tooltip } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

const MessageEditingInstruction = (): ReactElement => {
	return (
		<>
			<Tooltip variation='light' marginBlockEnd='x10' marginInlineStart='x20' fontScale='c2'>
				escape to{' '}
				<Box color='font-info' display='inline'>
					cancel
				</Box>{' '}
				or enter to{' '}
				<Box color='font-info' display='inline'>
					save
				</Box>
			</Tooltip>
		</>
	);
};

export default memo(MessageEditingInstruction);
