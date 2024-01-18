import { Tag } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type VersionStatus = 'outdated' | 'latest' | 'available_version' | undefined;

type VersionTagProps = {
	versionStatus: VersionStatus;
	title?: string;
};

export const VersionTag = ({ versionStatus, title }: VersionTagProps) => {
	const { t } = useTranslation();
	const tagStyle = {
		marginTop: '4px',
	};
	if (versionStatus === 'outdated') {
		return (
			<Tag title={title} variant='danger' style={{ ...tagStyle }}>
				{t('Outdated')}
			</Tag>
		);
	}

	if (versionStatus === 'latest') {
		return (
			<Tag title={title} variant='primary' style={{ ...tagStyle }}>
				{t('Latest')}
			</Tag>
		);
	}

	return (
		<Tag title={title} variant='secondary' style={{ ...tagStyle }}>
			{t('New_version_available')}
		</Tag>
	);
};
