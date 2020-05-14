import { Box, Flex, InputBox, Margins } from '@rocket.chat/fuselage';
import React from 'react';

export function Section({
	children,
	title,
	filter = <InputBox.Skeleton />,
}) {
	return <Box>
		<Margins block='x24'>
			<Flex.Container alignItems='center' wrap='no-wrap'>
				<Box>
					<Flex.Item grow={1}>
						<Box fontScale='s2' color='default'>{title}</Box>
					</Flex.Item>
					{filter && <Flex.Item grow={0}>
						{filter}
					</Flex.Item>}
				</Box>
			</Flex.Container>
			{children}
		</Margins>
	</Box>;
}
