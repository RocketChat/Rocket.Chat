import { AccordionItem, Box, Text } from '@rocket.chat/fuselage';
import { useTimeAgo } from '@rocket.chat/ui-client';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';

import { purifyOptions } from '../../../lib/purifyOptions';

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

const AppReleasesItem = ({ release, ...props }: ReleaseItemProps) => {
	const { t } = useTranslation();
	const formatDate = useTimeAgo();

	const title = (
		<Box display='flex' flexDirection='row'>
			<Box is='h4' fontScale='p1b' color='default' marginInlineEnd={24}>
				{release.version}
			</Box>
			<Text is='p' fontScale='p1' color='hint'>
				{formatDate(release.createdDate)}
			</Text>
		</Box>
	);

	return (
		<AccordionItem title={title} {...props}>
			{release.detailedChangelog?.rendered ? (
				<Box dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(release.detailedChangelog?.rendered, purifyOptions) }} color='default' />
			) : (
				<Text color='default'>{t('No_release_information_provided')}</Text>
			)}
		</AccordionItem>
	);
};

export default AppReleasesItem;
