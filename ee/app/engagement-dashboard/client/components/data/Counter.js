import { Box, Flex, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { Growth } from './Growth';

export function Counter({ count, variation = 0, description }) {
	return <>
		<Flex.Container alignItems='end'>
			<Box>
				<Box is='span' textColor='default' textStyle='h1' style={{ fontSize: '3em', lineHeight: 1 }}>
					{count}
				</Box>
				<Growth textStyle='s1'>{variation}</Growth>
			</Box>
		</Flex.Container>
		<Margins block='x12'>
			<Flex.Container alignItems='center'>
				<Box textStyle='p1' textColor='hint'>
					{description}
				</Box>
			</Flex.Container>
		</Margins>
	</>;
}
