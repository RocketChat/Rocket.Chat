import { Box, Flex, Grid, InputBox, Margins } from '@rocket.chat/fuselage';
import React from 'react';

export function Section({
	children,
	title,
	filter = <InputBox.Skeleton />,
}) {
	return <Margins block='x16'>
		<Grid>
			<Flex.Container alignItems='center'>
				<Grid.Item sm={4} md={6}>
					<Box textStyle='s2' textColor='default'>{title}</Box>
				</Grid.Item>
			</Flex.Container>
			{filter && <Grid.Item sm={4} md={2}>
				<Flex.Container>
					{filter}
				</Flex.Container>
			</Grid.Item>}
		</Grid>
		{children}
	</Margins>;
}
