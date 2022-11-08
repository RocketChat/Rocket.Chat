import { Box, Flex } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useUnreads } from './hooks/useUnreads';

const UnreadsPage: FC = () => {
	const [loading, error, unreads] = useUnreads();

	if (loading) {
		console.log('loading...', Date.now());
	} else if (error) {
		console.error(error);
	} else {
		console.log('Unreads', unreads, Date.now());
	}

	return (
		<Flex.Container direction='column' justifyContent='center'>
			<Box width='full' minHeight='sh' alignItems='center' backgroundColor='neutral-900' overflow='hidden' position='relative'>
				<Box
					position='absolute'
					style={{
						top: '5%',
						right: '2%',
					}}
					className='Self_Video'
					backgroundColor='#2F343D'
					alignItems='center'
				>
					<div>kalimera</div>
				</Box>
				<Box
					position='absolute'
					zIndex={1}
					style={{
						top: '20%',
						display: 'flex',
						justifyContent: 'center',
						flexDirection: 'column',
					}}
					alignItems='center'
				>
					<div>kalimera</div>
				</Box>
			</Box>
		</Flex.Container>
	);
};

export default UnreadsPage;
