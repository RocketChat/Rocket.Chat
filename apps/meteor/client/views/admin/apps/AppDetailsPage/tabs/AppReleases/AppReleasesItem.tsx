import { Accordion, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useTimeAgo } from '../../../../../../hooks/useTimeAgo';

type IRelease = {
	version: string;
	createdDate: string;
	detailedChangelog: {
		raw: string;
		rendered: string;
	};
};

type ReleaseItemProps = {
	release: IRelease;
};

const AppReleasesItem = ({ release, ...props }: ReleaseItemProps): ReactElement => {
	const t = useTranslation();
	const formatDate = useTimeAgo();

	const title = (
		<Box display='flex' flexDirection='row'>
			<Box is='h4' fontWeight='700' fontSize='x16' lineHeight='x24' color='default' mie='x24'>
				{release.version}
			</Box>
			<Box is='p' fontWeight='400' fontSize='x16' lineHeight='x24' color='hint'>
				{formatDate(release.createdDate)}
			</Box>
		</Box>
	);

	return (
		<Accordion.Item title={title} {...props}>
			{release.detailedChangelog?.rendered ? (
				<Box dangerouslySetInnerHTML={{ __html: release.detailedChangelog?.rendered }} />
			) : (
				t('No_release_information_provided')
			)}
		</Accordion.Item>
	);
};

export default AppReleasesItem;
