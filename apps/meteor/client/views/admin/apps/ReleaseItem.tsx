import { Accordion, Box } from '@rocket.chat/fuselage';
import React from 'react';

type release = {
	version: string;
	createdDate: string;
	detailedChangelog: {
		raw: string;
		rendered: string;
	};
};

type ReleaseItemProps = {
	release: release;
	key: string;
};

const ReleaseItem = ({ release, key, ...props }: ReleaseItemProps): JSX.Element => {
	const title = (
		<Box display='flex' flexDirection='row'>
			<Box is='h4' fontWeight='700' fontSize='x16' lineHeight='x24' color='default' mie='x24'>
				{release.version}
			</Box>
			<Box is='p' fontWeight='400' fontSize='x16' lineHeight='x24' color='info'>
				{release.createdDate}
			</Box>
		</Box>
	);

	return (
		<Accordion.Item key={key} title={title} {...props}>
			{release.detailedChangelog.raw}
		</Accordion.Item>
	);
};

export default ReleaseItem;
