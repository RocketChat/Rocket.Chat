import type { App } from '@rocket.chat/core-typings';
import { Box, Skeleton, Tag } from '@rocket.chat/fuselage';
import { AppAvatar } from '@rocket.chat/ui-avatar';
import moment from 'moment';
import React from 'react';
import { useTranslation } from 'react-i18next';

import AppMenu from '../AppMenu';
import BundleChips from '../BundleChips';
import { useAppBundledInQuery } from '../hooks/useAppBundledInQuery';
import { useAppInfoQuery } from '../hooks/useAppInfoQuery';
import { useAppQuery } from '../hooks/useAppQuery';
import AppStatus from './tabs/AppStatus';

type AppDetailsPageHeaderProps = {
	appId: App['id'];
};

const AppDetailsPageHeader = ({ appId }: AppDetailsPageHeaderProps) => {
	const { t } = useTranslation();
	const { isLoading: isAppInfoLoading, data: appInfo } = useAppInfoQuery(appId);
	const { isLoading, isError, data } = useAppQuery(appId);
	const { data: bundledIn } = useAppBundledInQuery(appId);

	if (isLoading || isError) {
		return (
			<Box display='flex' flexDirection='row' mbe={20} w='full'>
				<Skeleton variant='rect' w='x120' h='x120' mie={32} />
				<Box display='flex' flexDirection='column' justifyContent='space-between' flexGrow={1}>
					<Skeleton variant='rect' w='full' h='x32' />
					<Skeleton variant='rect' w='full' h='x32' />
					<Skeleton variant='rect' w='full' h='x32' />
				</Box>
			</Box>
		);
	}

	return (
		<Box color='default' display='flex' flexDirection='row' mbe={20} w='full'>
			<Box mie={32}>
				<AppAvatar size='x124' iconFileContent={data.iconFileContent} iconFileData={data.iconFileData} />
			</Box>
			<Box display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='row' alignItems='center' mbe={8}>
					<Box fontScale='h1' mie={8}>
						{data.name}
					</Box>
					{bundledIn && Boolean(bundledIn.length) && <BundleChips bundledIn={bundledIn} />}
				</Box>

				{data.shortDescription && (
					<Box fontScale='p1' mbe={16}>
						{data.shortDescription}
					</Box>
				)}

				<Box display='flex' flexDirection='row' alignItems='center' mbe={16}>
					{isAppInfoLoading && <Skeleton variant='rect' width={120} height={28} />}
					{appInfo && (
						<>
							<AppStatus app={appInfo} installed={data.installed} isAppDetailsPage />
							{(data.installed || data.isSubscribed) && <AppMenu app={appInfo} isAppDetailsPage />}
						</>
					)}
				</Box>
				<Box fontScale='c1' display='flex' flexDirection='row' color='hint' alignItems='center'>
					{data.author.name}
					<Box mi={16} color='disabled'>
						|
					</Box>
					<Box>{t('Version_version', { version: data.installed ? data.version : data.marketplaceVersion })}</Box>
					{data.modifiedAt && (
						<>
							<Box mi={16} color='disabled'>
								|
							</Box>
							<Box>
								{t('Marketplace_app_last_updated', {
									lastUpdated: moment(data.modifiedAt).fromNow(),
								})}
							</Box>
						</>
					)}

					{data.versionIncompatible && (
						<>
							<Box mi={16} color='disabled'>
								|
							</Box>

							<Box>
								<Tag title={t('App_version_incompatible_tooltip')} variant='secondary'>
									{t('Incompatible')}
								</Tag>
							</Box>
						</>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default AppDetailsPageHeader;
