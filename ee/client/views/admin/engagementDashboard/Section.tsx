import { Box, Flex, InputBox, Margins } from '@rocket.chat/fuselage';
import React, { ReactElement, ReactNode } from 'react';

type SectionProps = {
	children?: ReactNode;
	title?: ReactNode;
	filter?: ReactNode;
};

const Section = ({ children, title = undefined, filter = <InputBox.Skeleton /> }: SectionProps): ReactElement => (
	<Box>
		<Margins block='x24'>
			<Box display='flex' justifyContent='flex-end' alignItems='center' wrap='no-wrap'>
				{title && (
					<Box flexGrow={1} fontScale='p2' color='default'>
						{title}
					</Box>
				)}
				{filter && <Flex.Item grow={0}>{filter}</Flex.Item>}
			</Box>
			{children}
		</Margins>
	</Box>
);

export default Section;
