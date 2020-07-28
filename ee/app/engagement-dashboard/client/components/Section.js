import { Box, Flex, InputBox, Margins } from '@rocket.chat/fuselage';
import React from 'react';

export function Section({
	children,
	title,
	filter = <InputBox.Skeleton />,
}) {
	return <Box>
		<Margins block='x24'>
			<Box display='flex' alignItems='center' wrap='no-wrap'>
				<Box flexGrow={1} fontScale='s2' color='default'>{title}</Box>
				{filter && <Flex.Item grow={0}>
					<Margins mi='x24'>
						{filter}
					</Margins>
				</Flex.Item>}
			</Box>
			{children}
		</Margins>
	</Box>;
}
