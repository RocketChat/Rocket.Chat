import type { App } from '@rocket.chat/core-typings';
import { Box, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import type { ReactElement } from 'react';
import React from 'react';

import AppAvatar from '../../../../components/avatar/AppAvatar';
import AppMenu from '../AppMenu';
import BundleChips from '../BundleChips';
import { appIncompatibleStatusProps } from '../helpers';
import AppStatus from './tabs/AppStatus';

const versioni18nKey = (app: App): string => {
	const { version, marketplaceVersion, installed } = app;

	return installed ? version : marketplaceVersion;
};

const AppDetailsPageHeader = ({ app }: { app: App }): ReactElement => {
	const t = useTranslation();
	const {
		iconFileData,
		name,
		author,
		iconFileContent,
		installed,
		modifiedAt,
		bundledIn,
		versionIncompatible,
		isSubscribed,
		shortDescription,
	} = app;

	const lastUpdated = modifiedAt && moment(modifiedAt).fromNow();
	const incompatibleStatus = versionIncompatible ? appIncompatibleStatusProps() : undefined;

	return (
		<Box color='default' display='flex' flexDirection='row' mbe='x20' w='full'>
			<AppAvatar size='x124' mie='x20' iconFileContent={iconFileContent} iconFileData={iconFileData} />
			<Box display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='row' alignItems='center' mbe='x8'>
					<Box fontScale='h1' mie='x8'>
						{name}
					</Box>
					{bundledIn && Boolean(bundledIn.length) && <BundleChips bundledIn={bundledIn} />}
				</Box>

				{shortDescription && (
					<Box fontScale='p1' mbe='x16'>
						{shortDescription}
					</Box>
				)}

				<Box display='flex' flexDirection='row' alignItems='center' mbe='x16'>
					<AppStatus app={app} installed={installed} isAppDetailsPage />
					{(installed || isSubscribed) && <AppMenu app={app} isAppDetailsPage />}
				</Box>
				<Box fontScale='c1' display='flex' flexDirection='row' color='hint' alignItems='center'>
					{author?.name}
					<Box mi='x16' color='disabled'>
						|
					</Box>

					<Box>{t('Version_version', { version: versioni18nKey(app) })}</Box>

					{lastUpdated && (
						<>
							<Box mi='x16' color='disabled'>
								|
							</Box>
							<Box>
								{t('Marketplace_app_last_updated', {
									lastUpdated,
								})}
							</Box>
						</>
					)}

					{versionIncompatible && (
						<>
							<Box mi='x16' color='disabled'>
								|
							</Box>

							<Box mi='x16'>
								<Tag
									title={incompatibleStatus?.tooltipText}
									variant={incompatibleStatus?.label === 'Disabled' ? 'secondary-danger' : 'secondary'}
								>
									{incompatibleStatus?.label}
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
