import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import Attachment from './Attachment';

type AttachmentBlockProps = { pre?: ReactNode; color?: string | undefined; children?: ReactNode };

const AttachmentBlock = ({ pre, color = 'annotation', children }: AttachmentBlockProps) => (
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
