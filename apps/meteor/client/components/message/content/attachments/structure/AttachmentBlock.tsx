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
			pis={16}
			borderRadius={2}
			borderInlineStartStyle='solid'
			borderInlineStartWidth='default'
			borderInlineStartColor={color}
			children={children}
		/>
	</Attachment>
);

export default AttachmentBlock;
