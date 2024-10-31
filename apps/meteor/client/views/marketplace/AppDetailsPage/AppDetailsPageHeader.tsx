import type { App } from '@rocket.chat/core-typings';
import { Box, Skeleton, Tag } from '@rocket.chat/fuselage';
import { AppAvatar } from '@rocket.chat/ui-avatar';
import moment from 'moment';
import React from 'react';
import { useTranslation } from 'react-i18next';

import AppMenu from '../AppMenu';
import BundleChips from '../BundleChips';
import AppStatus from '../components/AppStatus';
import { useAppInfoQuery } from '../hooks/useAppInfoQuery';

type AppDetailsPageHeaderProps = {
	app: App;
};

const AppDetailsPageHeader = ({ app }: AppDetailsPageHeaderProps) => {
	const { t } = useTranslation();
	const { isLoading: isAppInfoLoading, data: appInfo } = useAppInfoQuery(app.id);

	return (
		<Box color='default' display='flex' flexDirection='row' mbe={20} w='full'>
			<Box mie={32}>
				<AppAvatar size='x124' iconFileContent={app.iconFileContent} iconFileData={app.iconFileData} />
			</Box>
			<Box display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='row' alignItems='center' mbe={8}>
					<Box fontScale='h1' mie={8}>
						{app.name}
					</Box>
					{app.bundledIn && app.bundledIn.length > 0 && <BundleChips bundledIn={app.bundledIn} />}
				</Box>

				{app.shortDescription && (
					<Box fontScale='p1' mbe={16}>
						{app.shortDescription}
					</Box>
				)}

				<Box display='flex' flexDirection='row' alignItems='center' mbe={16}>
					{isAppInfoLoading && <Skeleton variant='rect' width={120} height={28} />}
					{appInfo && (
						<>
							<AppStatus app={appInfo} installed={app.installed} isAppDetailsPage />
							{(app.installed || app.isSubscribed) && <AppMenu app={appInfo} isAppDetailsPage />}
						</>
					)}
				</Box>
				<Box fontScale='c1' display='flex' flexDirection='row' color='hint' alignItems='center'>
					{app.author.name}
					<Box mi={16} color='disabled'>
						|
					</Box>
					<Box>{t('Version_version', { version: app.installed ? app.version : app.marketplaceVersion })}</Box>
					{app.modifiedAt && (
						<>
							<Box mi={16} color='disabled'>
								|
							</Box>
							<Box>
								{t('Marketplace_app_last_updated', {
									lastUpdated: moment(app.modifiedAt).fromNow(),
								})}
							</Box>
						</>
					)}

					{app.versionIncompatible && (
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
