import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import Attachment from './Attachment';

const Block: FC<{ pre?: JSX.Element | string | undefined; color?: string | undefined }> = ({
	pre,
	color = 'neutral-600',
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

export default Block;
