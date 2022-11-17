import type { App } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React, { ReactElement } from 'react';

import AppAvatar from '../../../../components/avatar/AppAvatar';
import AppMenu from '../AppMenu';
import BundleChips from '../BundleChips';
import AppStatus from './tabs/AppStatus';

const AppDetailsPageHeader = ({ app }: { app: App }): ReactElement => {
	const t = useTranslation();
	const { iconFileData, name, author, version, iconFileContent, installed, isSubscribed, modifiedAt, bundledIn } = app;
	const lastUpdated = modifiedAt && moment(modifiedAt).fromNow();

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
					<Box mi='x16'>{t('Version_version', { version })}</Box>
					{lastUpdated && (
						<>
							<Box is='span'> | </Box>
							<Box mis='x16'>
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
