import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

import Attachment from './Attachment';

const AttachmentBlock: FC<{ pre?: JSX.Element | string | undefined; color?: string | undefined }> = ({
	pre,
	color = 'annotation',
	children,
}) => (
	<Attachment>
		{pre}
		<Box
			display='flex'
			flexDirection='row'
			pis='x16'
			borderRadius='x2'
			borderInlineStartStyle='solid'
			borderInlineStartWidth='x2'
			borderInlineStartColor={color}
			children={children}
		/>
	</Attachment>
);

export default AttachmentBlock;
