import { Accordion, Box } from '@rocket.chat/fuselage';
import React from 'react';

import ReleaseItem from './ReleaseItem';

const AppReleases = (): JSX.Element => {
	const title = (
		<Box display='flex' flexDirection='row'>
			<Box is='h4' fontWeight='700' fontSize='x16' lineHeight='x24' color='default' mie='x24'>
				3.18.0
			</Box>
			<Box is='p' fontWeight='400' fontSize='x16' lineHeight='x24' color='info'>
				2 days ago
			</Box>
		</Box>
	);

	return (
		<>
			<Accordion width='100%' alignSelf='center'>
				<ReleaseItem title={title} />
			</Accordion>
		</>
	);
};

export default AppReleases;
