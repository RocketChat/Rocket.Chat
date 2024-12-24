import { Tag } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type VersionStatus = 'outdated' | 'latest' | 'available_version' | undefined;

type VersionTagProps = {
	versionStatus: VersionStatus;
	title?: string;
};

export const VersionTag = ({ versionStatus, title }: VersionTagProps) => {
	const { t } = useTranslation();
	if (versionStatus === 'outdated') {
		return (
			<Tag title={title} variant='danger'>
				{t('Outdated')}
			</Tag>
		);
	}

	if (versionStatus === 'latest') {
		return (
			<Tag title={title} variant='primary'>
				{t('Latest')}
			</Tag>
		);
	}

	return (
		<Tag title={title} variant='secondary'>
			{t('New_version_available')}
		</Tag>
	);
};
