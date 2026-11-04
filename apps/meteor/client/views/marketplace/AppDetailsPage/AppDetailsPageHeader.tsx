import type { App } from '@rocket.chat/core-typings';
import { Box, Button, Tag } from '@rocket.chat/fuselage';
import { AppAvatar } from '@rocket.chat/ui-avatar';
import { useRoute } from '@rocket.chat/ui-contexts';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { useTranslation } from 'react-i18next';

import AppMenu from '../AppMenu';
import BundleChips from '../BundleChips';
import { appEnabledStatuses, appIncompatibleStatusProps } from '../helpers';
import AppStatus from './tabs/AppStatus';

const versioni18nKey = (app: App): string => {
	const { version, marketplaceVersion, installed } = app;

	return installed ? version : marketplaceVersion;
};

export type AppDetailsPageHeaderProps = { app: App };

const AppDetailsPageHeader = ({ app }: AppDetailsPageHeaderProps) => {
	const { t } = useTranslation();
	const appHomeRoute = useRoute('app-home');
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
		status,
	} = app;

	const lastUpdated = modifiedAt && formatDistanceToNow(new Date(modifiedAt), { addSuffix: true });
	const incompatibleStatus = versionIncompatible ? appIncompatibleStatusProps() : undefined;

	return (
		<Box color='default' display='flex' flexDirection='row' marginBlockEnd='x20' width='full'>
			<Box marginInlineEnd='x32'>
				<AppAvatar size='x124' iconFileContent={iconFileContent} iconFileData={iconFileData} />
			</Box>
			<Box display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='row' alignItems='center' marginBlockEnd='x8'>
					<Box fontScale='h1' marginInlineEnd='x8'>
						{name}
					</Box>
					{bundledIn && Boolean(bundledIn.length) && <BundleChips bundledIn={bundledIn} />}
				</Box>

				{shortDescription && (
					<Box fontScale='p1' marginBlockEnd='x16'>
						{shortDescription}
					</Box>
				)}

				<Box display='flex' flexDirection='row' alignItems='center' marginBlockEnd='x16'>
					<AppStatus app={app} installed={installed} isAppDetailsPage />
					{installed && status && appEnabledStatuses.includes(status) && (
						<Box marginInlineStart='x8'>
							<Button size='small' onClick={() => appHomeRoute.push({ appId: app.id })}>
								{t('Home')}
							</Button>
						</Box>
					)}
					{(installed || isSubscribed) && <AppMenu app={app} isAppDetailsPage />}
				</Box>
				<Box fontScale='c1' display='flex' flexDirection='row' color='hint' alignItems='center'>
					{author?.name}
					<Box marginInline='x16' color='disabled'>
						|
					</Box>
					<Box>{t('Version_version', { version: versioni18nKey(app) })}</Box>
					{lastUpdated && (
						<>
							<Box marginInline='x16' color='disabled'>
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
							<Box marginInline='x16' color='disabled'>
								|
							</Box>

							<Box>
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
