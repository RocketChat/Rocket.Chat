import { Box, Button, ButtonGroup, Skeleton } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import Page from './Page';

const PageSkeleton: FC = () => (
	<Page>
		<Page.Header title={<Skeleton width='x320' maxWidth='full' />}>
			<ButtonGroup>
				<Button disabled primary>
					<Skeleton width='x80' />
				</Button>
			</ButtonGroup>
		</Page.Header>

		<Page.Content>
			<Box marginBlock='none' marginInline='auto' width='full' maxWidth='x580'>
				<Box is='p' color='hint' fontScale='p1'>
					<Skeleton />
					<Skeleton />
					<Skeleton width='75%' />
				</Box>
			</Box>
		</Page.Content>
	</Page>
);

export default PageSkeleton;
