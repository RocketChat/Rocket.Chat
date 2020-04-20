import { Box, Button, ButtonGroup, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

import { Page } from '../../../../client/components/basic/Page';

function PageSkeleton() {
	return <Page>
		<Page.Header title={<Skeleton width='20rem' />}>
			<ButtonGroup>
				<Button
					children={<Skeleton width='5rem' />}
					disabled
					primary
				/>
			</ButtonGroup>
		</Page.Header>

		<Page.Content>
			<Box mb='0' mi='auto' width='full' maxWidth='590px'>
				<Box is='p' textColor='hint' textStyle='p1'>
					<Skeleton />
					<Skeleton />
					<Skeleton width='75%' />
				</Box>
			</Box>
		</Page.Content>
	</Page>;
}

export default PageSkeleton;
