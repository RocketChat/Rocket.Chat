import { Box, Button, ButtonGroup, Skeleton } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import Page from './Page';

const PageSkeleton = (): ReactElement => (
	<Page>
		<Page.Header title={<Skeleton width='x320' maxWidth='full' />}>
			<ButtonGroup>
				<Button children={<Skeleton width='x80' />} disabled primary />
			</ButtonGroup>
		</Page.Header>

		<Page.Content>
			<Box marginBlock='none' marginInline='auto' width='full' maxWidth='x580'>
				<Box is='p' color='hint' fontScale='p2'>
					<Skeleton />
					<Skeleton />
					<Skeleton width='75%' />
				</Box>
			</Box>
		</Page.Content>
	</Page>
);

export default PageSkeleton;
