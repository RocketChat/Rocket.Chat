import { Box, Icon } from '@rocket.chat/fuselage';
import { formatDistanceStrict } from 'date-fns';
import React, { FC } from 'react';

import AppAvatar from '../../../components/avatar/AppAvatar';
import { useTranslation } from '../../../contexts/TranslationContext';
import AppMenu from './AppMenu';
import AppStatus from './AppStatus';
import { App } from './types';

type AppDetailsPageHeaderProps = {
	app: App;
};

const AppDetailsHeader: FC<AppDetailsPageHeaderProps> = ({ app }) => {
	const t = useTranslation();

	const { iconFileData = '', name, author, version, iconFileContent, installed, modifiedAt, bundledIn, description } = app;
	console.log(app);
	return (
		<Box display='flex' flexDirection='row' mbe='x20' w='full'>
			<AppAvatar size='x124' mie='x20' iconFileContent={iconFileContent} iconFileData={iconFileData} />
			<Box display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='row' alignItems='center' mbe='x8'>
					<Box fontScale='h1' mie='x8'>
						{name}
					</Box>
					{Boolean(bundledIn.length) &&
						bundledIn.map((bundle) => (
							<Box
								display='flex'
								flexDirection='row'
								alignItems='center'
								justifyContent='center'
								backgroundColor='disabled'
								pi='x4'
								height='x20'
								borderRadius='x2'
							>
								<Icon name='bag' size='x20' />
								<Box fontWeight='700' fontSize='x12' color='info'>
									{bundle.bundleName} Bundle
								</Box>
							</Box>
						))}
				</Box>
				<Box mbe='x16'>{description}</Box>
				<Box display='flex' flexDirection='row' alignItems='center' mbe='x16'>
					<Box display='flex' flexDirection='row' alignItems='center'>
						<AppStatus app={app} installed={installed} isAppDetailsPage={true} mie='x8' />
					</Box>
					{installed && <AppMenu app={app} />}
				</Box>
				<Box display='flex' flexDirection='row' color='hint' alignItems='center'>
					<Box fontScale='p2m' mie='x16'>
						{t('By_author', { author: author?.name })}
					</Box>
					| <Box mi='x16'>{t('Version_version', { version })}</Box> |{' '}
					<Box mis='x16'>Last updated {formatDistanceStrict(new Date(modifiedAt), new Date(), { addSuffix: false })} ago</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default AppDetailsHeader;
