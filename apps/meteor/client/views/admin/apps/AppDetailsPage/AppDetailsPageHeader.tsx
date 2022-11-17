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
	const { iconFileData, name, author, version, iconFileContent, installed, isSubscribed, modifiedAt, bundledIn, shortDescription } = app;
	const lastUpdated = modifiedAt && moment(modifiedAt).fromNow();

	return (
		<Box display='flex' flexDirection='row' mbe='x20' w='full'>
			<AppAvatar size='x124' mie='x32' iconFileContent={iconFileContent} iconFileData={iconFileData} />
			<Box display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='row' alignItems='center' mbe='x8'>
					<Box fontScale='h1' mie='x8'>
						{name}
					</Box>
					{bundledIn && Boolean(bundledIn.length) && <BundleChips bundledIn={bundledIn} />}
				</Box>
				{shortDescription && (
					<Box fontScale='p1' color='default' mbe='x16'>
						{shortDescription}
					</Box>
				)}
				<Box display='flex' flexDirection='row' alignItems='center' mbe='x16'>
					<AppStatus app={app} installed={installed} isAppDetailsPage={true} isSubscribed={isSubscribed} />
					{(installed || isSubscribed) && <AppMenu app={app} mis='x8' />}
				</Box>
				<Box display='flex' flexDirection='row' color='hint' alignItems='center'>
					<Box fontScale='c1' mie='x16'>
						{author?.name}
					</Box>
					<Box fontScale='c1' color='stroke-light'>
						|
					</Box>
					<Box fontScale='c1' mi='x16'>
						{t('Version_version', { version })}
					</Box>
					{lastUpdated && (
						<>
							<Box fontScale='c1' color='stroke-light'>
								|
							</Box>
							<Box fontScale='c1' mis='x16'>
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
