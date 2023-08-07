import { Box, Skeleton } from '@rocket.chat/fuselage';
import { MessageComposer, MessageComposerToolbar } from '@rocket.chat/ui-composer';
import type { FC } from 'react';
import React, { memo } from 'react';

const ComposerSkeleton: FC = () => (
	<Box padding={24} display='flex'>
		<MessageComposer>
			<>
				<Box width='100%' display='flex' alignItems='center' height='x52' pi={12}>
					<Skeleton width='100%' height={36} />
				</Box>
				<MessageComposerToolbar height={36} />
			</>
		</MessageComposer>
	</Box>
);
export default memo(ComposerSkeleton);
