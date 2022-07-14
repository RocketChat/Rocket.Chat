import { Accordion, Box } from '@rocket.chat/fuselage';
import React from 'react';

import { useTimeAgo } from '../../../hooks/useTimeAgo';

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
};

const ReleaseItem = ({ release, ...props }: ReleaseItemProps): JSX.Element => {
	const formatDate = useTimeAgo();

	const title = (
		<Box display='flex' flexDirection='row'>
			<Box is='h4' fontWeight='700' fontSize='x16' lineHeight='x24' color='default' mie='x24'>
				{release.version}
			</Box>
			<Box is='p' fontWeight='400' fontSize='x16' lineHeight='x24' color='info'>
				{formatDate(release.createdDate)}
			</Box>
		</Box>
	);

	return (
		<Accordion.Item title={title} {...props}>
			{release.detailedChangelog?.rendered ? (
				<Box dangerouslySetInnerHTML={{ __html: release.detailedChangelog?.rendered }} />
			) : (
				'No release information provided'
			)}
		</Accordion.Item>
	);
};

export default ReleaseItem;
