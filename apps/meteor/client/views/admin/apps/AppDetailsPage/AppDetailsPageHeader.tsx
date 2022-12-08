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
	const { version, marketplaceVersion, marketplace } = app;
	if (typeof marketplace === 'boolean') {
		return marketplaceVersion;
	}

	return version;
};

const AppDetailsPageHeader = ({ app }: { app: App }): ReactElement => {
	const t = useTranslation();
	const { iconFileData, name, author, iconFileContent, installed, modifiedAt, bundledIn, versionIncompatible, isSubscribed } = app;
	const lastUpdated = modifiedAt && moment(modifiedAt).fromNow();
	const incompatibleStatus = versionIncompatible ? appIncompatibleStatusProps() : undefined;

	return (
		<Box display='flex' flexDirection='row' mbe='x20' w='full'>
			<AppAvatar size='x124' mie='x20' iconFileContent={iconFileContent} iconFileData={iconFileData} />
			<Box display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='row' alignItems='center' mbe='x8'>
					<Box fontScale='h1' mie='x8'>
						{name}
					</Box>
					{bundledIn && Boolean(bundledIn.length) && <BundleChips bundledIn={bundledIn} />}
				</Box>
				{app?.shortDescription && <Box mbe='x16'>{app.shortDescription}</Box>}

				<Box display='flex' flexDirection='row' alignItems='center' mbe='x16'>
					<AppStatus app={app} installed={installed} isAppDetailsPage />
					{(installed || isSubscribed) && <AppMenu app={app} isAppDetailsPage mis='x8' />}
				</Box>
				<Box display='flex' flexDirection='row' color='hint' alignItems='center'>
					<Box fontScale='p2m' mie='x16'>
						{t('By_author', { author: author?.name })}
					</Box>
					<Box is='span'> | </Box>

					<Box mi='x16' marginInlineEnd='x4'>
						{t('Version_version', { version: versioni18nKey(app) })}
					</Box>

					{versionIncompatible && (
						<Box is='span' marginInlineEnd='x16' marginBlockStart='x4'>
							<Tag
								title={incompatibleStatus?.tooltipText}
								variant={incompatibleStatus?.label === 'Disabled' ? 'secondary-danger' : 'secondary'}
							>
								{incompatibleStatus?.label}
							</Tag>
						</Box>
					)}

					{lastUpdated && (
						<>
							<Box is='span'> | </Box>
							<Box mi='x16'>
								{t('Marketplace_app_last_updated', {
									lastUpdated,
								})}
							</Box>
						</>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default AppDetailsPageHeader;
