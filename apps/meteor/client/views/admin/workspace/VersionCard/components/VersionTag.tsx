import { Tag } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type VersionStatus = 'outdated' | 'latest' | 'available_version' | undefined;

type VersionTagProps = {
	versionStatus: VersionStatus;
};

export const VersionTag = ({ versionStatus }: VersionTagProps) => {
	const { t } = useTranslation();
	if (versionStatus === 'outdated') {
		return <Tag variant='danger'>{t('Outdated')}</Tag>;
	}

	if (versionStatus === 'latest') {
		return <Tag variant='primary'>{t('Latest')}</Tag>;
	}

	return <Tag variant='secondary'>{t('New_version_available')}</Tag>;
};
