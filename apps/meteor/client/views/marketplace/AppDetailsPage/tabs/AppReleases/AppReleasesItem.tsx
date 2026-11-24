import { AccordionItem, Stack, Text } from '@rocket.chat/fuselage';
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
		<Stack direction='row' gap='x24'>
			<Text is='h4' fontScale='p1b' color='default'>
				{release.version}
			</Text>
			<Text is='p' fontScale='p1' color='hint'>
				{formatDate(release.createdDate)}
			</Text>
		</Stack>
	);

	return (
		<AccordionItem title={title} {...props}>
			{release.detailedChangelog?.rendered ? (
				<Text
					color='default'
					dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(release.detailedChangelog?.rendered, purifyOptions) }}
				/>
			) : (
				<Text color='default'>{t('No_release_information_provided')}</Text>
			)}
		</AccordionItem>
	);
};

export default AppReleasesItem;
