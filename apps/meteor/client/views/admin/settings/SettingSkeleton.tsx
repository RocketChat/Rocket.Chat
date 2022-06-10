import { Field, Flex, InputBox, Skeleton } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

const SettingSkeleton = (): ReactElement => (
	<Field>
		<Flex.Item align='stretch'>
			<Field.Label>
				<Skeleton width='25%' />
			</Field.Label>
		</Flex.Item>
		<Field.Row>
			<InputBox.Skeleton />
		</Field.Row>
	</Field>
);

export default SettingSkeleton;
