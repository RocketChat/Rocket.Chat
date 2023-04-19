import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

type ReadReceiptIndicatorProps = {
	unread?: boolean;
};

const ReadReceiptIndicator = ({ unread }: ReadReceiptIndicatorProps): ReactElement | null => (
	<Box position='absolute' insetBlockStart={2} insetInlineEnd={8}>
		<Icon name='check' size='x16' color={unread ? 'annotation' : 'info'} />
	</Box>
);

export default ReadReceiptIndicator;
