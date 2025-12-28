import { Box, Button, ButtonGroup, Skeleton } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';

const PageSkeleton = (): ReactElement => (
	<Page>
		<PageHeader title={<Skeleton width='x320' maxWidth='full' />}>
			<ButtonGroup>
				<Button children={<Skeleton width='x80' />} disabled />
			</ButtonGroup>
		</PageHeader>
		<PageContent>
			<Box marginBlock='none' marginInline='auto' width='full' maxWidth='x580'>
				<Box is='p' color='hint' fontScale='p2'>
					<Skeleton />
					<Skeleton />
					<Skeleton width='75%' />
				</Box>
			</Box>
		</PageContent>
	</Page>
);

export default PageSkeleton;
