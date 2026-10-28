import type { App } from '@rocket.chat/core-typings';
import { Stack, Tag, Text } from '@rocket.chat/fuselage';
import { AppAvatar } from '@rocket.chat/ui-avatar';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { useTranslation } from 'react-i18next';

import AppMenu from '../AppMenu';
import BundleChips from '../BundleChips';
import { appIncompatibleStatusProps } from '../helpers';
import AppDetailsHeaderLayout from './layout/AppDetailsHeaderLayout';
import AppDetailsMetadata from './layout/AppDetailsMetadata';
import AppStatus from './tabs/AppStatus';

const versioni18nKey = (app: App): string => {
	const { version, marketplaceVersion, installed } = app;

	return installed ? version : marketplaceVersion;
};

export type AppDetailsPageHeaderProps = { app: App };

const AppDetailsPageHeader = ({ app }: AppDetailsPageHeaderProps) => {
	const { t } = useTranslation();
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

	const lastUpdated = modifiedAt && formatDistanceToNow(new Date(modifiedAt), { addSuffix: true });
	const incompatibleStatus = versionIncompatible ? appIncompatibleStatusProps() : undefined;

	return (
		<AppDetailsHeaderLayout avatar={<AppAvatar size='x124' iconFileContent={iconFileContent} iconFileData={iconFileData} />}>
			<Stack gap='x8'>
				<Stack direction='row' align='center' gap='x8'>
					<Text fontScale='h1'>{name}</Text>
					{bundledIn && Boolean(bundledIn.length) && (
						<Stack direction='row' align='center'>
							<BundleChips bundledIn={bundledIn} />
						</Stack>
					)}
				</Stack>

				<Stack gap='x16'>
					{shortDescription && <Text fontScale='p1'>{shortDescription}</Text>}

					<Stack direction='row' align='center'>
						<AppStatus app={app} installed={installed} isAppDetailsPage />
						{(installed || isSubscribed) && <AppMenu app={app} isAppDetailsPage />}
					</Stack>

					<AppDetailsMetadata>
						{author?.name}
						<Text color='disabled'>|</Text>
						<Text>{t('Version_version', { version: versioni18nKey(app) })}</Text>
						{lastUpdated && (
							<>
								<Text color='disabled'>|</Text>
								<Text>
									{t('Marketplace_app_last_updated', {
										lastUpdated,
									})}
								</Text>
							</>
						)}

						{versionIncompatible && (
							<>
								<Text color='disabled'>|</Text>
								<Tag
									title={incompatibleStatus?.tooltipText}
									variant={incompatibleStatus?.label === 'Disabled' ? 'secondary-danger' : 'secondary'}
								>
									{incompatibleStatus?.label}
								</Tag>
							</>
						)}
					</AppDetailsMetadata>
				</Stack>
			</Stack>
		</AppDetailsHeaderLayout>
	);
};

export default AppDetailsPageHeader;
