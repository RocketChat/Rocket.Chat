import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import React, { Suspense } from 'react';

import { ContextualbarDialog } from '../../../components/Contextualbar';
import HeaderSkeleton from '../Header/HeaderSkeleton';

type RoomLayoutProps = {
	header?: ReactNode;
	body?: ReactNode;
	footer?: ReactNode;
	aside?: ReactNode;
} & ComponentProps<typeof Box>;

const RoomLayout = ({ header, body, footer, aside, ...props }: RoomLayoutProps): ReactElement => (
	<Box h='full' display='flex' flexDirection='column' bg='room' {...props}>
		<Suspense fallback={<HeaderSkeleton />}>{header}</Suspense>
		<Box display='flex' flexGrow={1} overflow='hidden' height='full' position='relative'>
			<Box display='flex' flexDirection='column' flexGrow={1} minWidth={0}>
				<Box is='div' display='flex' flexDirection='column' flexGrow={1}>
					<Suspense fallback={null}>{body}</Suspense>
				</Box>
				{footer && <Suspense fallback={null}>{footer}</Suspense>}
			</Box>
			{aside && (
				<ContextualbarDialog>
					<Suspense fallback={null}>{aside}</Suspense>
				</ContextualbarDialog>
			)}
		</Box>
	</Box>
);

export default RoomLayout;
