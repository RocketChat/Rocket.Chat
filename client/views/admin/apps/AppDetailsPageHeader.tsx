import { Box } from '@rocket.chat/fuselage';
import { data } from 'jquery';
import React, { FC } from 'react';

import AppAvatar from '../../../components/avatar/AppAvatar';
import { useTranslation } from '../../../contexts/TranslationContext';
import AppMenu from './AppMenu';
import AppStatus from './AppStatus';
import PriceDisplay from './PriceDisplay';
import { App } from './types';

type AppDetailsPageHeaderProps = {
	app: App;
};

const AppDetailsPageHeader: FC<AppDetailsPageHeaderProps> = ({ app }) => {
	const t = useTranslation();

	const { iconFileData = '', name, author, version, price, purchaseType, pricingPlans, iconFileContent, installed } = app || {};

	return (
		<Box display='flex' flexDirection='row' mbe='x20' w='full'>
			<AppAvatar size='x124' mie='x20' iconFileContent={iconFileContent} iconFileData={iconFileData} />
			<Box display='flex' flexDirection='column' justifyContent='space-between' flexGrow={1}>
				<Box fontScale='h2'>{name}</Box>
				<Box display='flex' flexDirection='row' color='hint' alignItems='center'>
					<Box fontScale='p2m' mie='x4'>
						{t('By_author', { author: author?.name })}
					</Box>
					|<Box mis='x4'>{t('Version_version', { version })}</Box>
				</Box>
				<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
					<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' marginInline='neg-x8'>
						<AppStatus app={data} marginInline='x8' />
						{!installed && (
							<PriceDisplay purchaseType={purchaseType} pricingPlans={pricingPlans} price={price} showType={false} marginInline='x8' />
						)}
					</Box>
					{installed && <AppMenu app={app} />}
				</Box>
			</Box>
		</Box>
	);
};

export default AppDetailsPageHeader;
