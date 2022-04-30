import { Icon, Margins, Box, Flex } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { IGame } from '../../../definition/IGame';

const SingleGame = ({ title }: Partial<IGame>): ReactElement => (
	<Margins block='15px'>
		<Box display='flex' alignItems='center' justifyContent='space-between' style={{ cursor: 'pointer' }}>
			<Flex.Item>{title}</Flex.Item>
			<Flex.Item>
				<Icon name='chevron-left' size='x20' />
			</Flex.Item>
		</Box>
	</Margins>
);

export default SingleGame;
