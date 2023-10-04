import { Field, FieldLabel, FieldRow, Flex, InputBox, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const SettingSkeleton = (): ReactElement => (
	<Field>
		<Flex.Item align='stretch'>
			<FieldLabel>
				<Skeleton width='25%' />
			</FieldLabel>
		</Flex.Item>
		<FieldRow>
			<InputBox.Skeleton />
		</FieldRow>
	</Field>
);

export default SettingSkeleton;
