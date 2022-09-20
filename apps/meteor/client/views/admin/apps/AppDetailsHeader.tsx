import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React, { ReactElement } from 'react';

import AppAvatar from '../../../components/avatar/AppAvatar';
import AppMenu from './AppMenu';
import AppStatus from './AppStatus';
import BundleChips from './BundleChips';
import { App } from './types';

const AppDetailsHeader = ({ app }: { app: App }): ReactElement => {
	const t = useTranslation();
	const { iconFileData, name, author, version, iconFileContent, installed, isSubscribed, modifiedAt, bundledIn, description } = app;
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
				<Box mbe='x16'>{description}</Box>
				<Box display='flex' flexDirection='row' alignItems='center' mbe='x16'>
					<Box display='flex' flexDirection='row' alignItems='center'>
						<AppStatus app={app} installed={installed} isAppDetailsPage={true} mie='x8' isSubscribed={isSubscribed} />
					</Box>
					{(installed || isSubscribed) && <AppMenu app={app} />}
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

export default AppDetailsHeader;
