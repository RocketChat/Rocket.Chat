import React, { FC } from 'react';
import { Box, Chip, Divider, Margins } from '@rocket.chat/fuselage';

import AppAvatar from '../../../components/avatar/AppAvatar';
import ExternalLink from '../../../components/ExternalLink';
import PriceDisplay from './PriceDisplay';
import AppStatus from './AppStatus';
import AppMenu from './AppMenu';
import { useTranslation } from '../../../contexts/TranslationContext';
import { App } from './types';

type AppDetailsPageContentProps = {
	data: App;
};

const AppDetailsPageContent: FC<AppDetailsPageContentProps> = ({ data }) => {
	const t = useTranslation();

	const {
		iconFileData = '',
		name,
		author: { name: authorName, homepage, support },
		description,
		categories = [],
		version,
		price,
		purchaseType,
		pricingPlans,
		iconFileContent,
		installed,
		bundledIn,
	} = data;

	return <>
		<Box display='flex' flexDirection='row' mbe='x20' w='full'>
			<AppAvatar size='x124' mie='x20' iconFileContent={iconFileContent} iconFileData={iconFileData}/>
			<Box display='flex' flexDirection='column' justifyContent='space-between' flexGrow={1}>
				<Box fontScale='h1'>{name}</Box>
				<Box display='flex' flexDirection='row' color='hint' alignItems='center'>
					<Box fontScale='p2' mie='x4'>{t('By_author', { author: authorName })}</Box>
					|
					<Box mis='x4'>{t('Version_version', { version })}</Box>
				</Box>
				<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
					<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' marginInline='neg-x8'>
						<AppStatus app={data} marginInline='x8'/>
						{!installed && <PriceDisplay
							purchaseType={purchaseType}
							pricingPlans={pricingPlans}
							price={price}
							showType={false}
							marginInline='x8'
						/>}
					</Box>
					{installed && <AppMenu app={data} />}
				</Box>
			</Box>
		</Box>
		<Divider />
		<Box display='flex' flexDirection='column'>
			<Margins block='x12'>
				<Box fontScale='s2'>{t('Categories')}</Box>
				<Box display='flex' flexDirection='row'>
					{categories && categories.map((current) =>
						<Chip key={current} textTransform='uppercase' mie='x8'>
							<Box color='hint'>{current}</Box>
						</Chip>)}
				</Box>

				<Box fontScale='s2'>{t('Contact')}</Box>
				<Box display='flex' flexDirection='row' flexGrow={1} justifyContent='space-around' flexWrap='wrap'>
					<Box display='flex' flexDirection='column' mie='x12' flexGrow={1}>
						<Box fontScale='s1' color='hint'>{t('Author_Site')}</Box>
						<ExternalLink to={homepage} />
					</Box>
					<Box display='flex' flexDirection='column' flexGrow={1}>
						<Box fontScale='s1' color='hint'>{t('Support')}</Box>
						<ExternalLink to={support} />
					</Box>
				</Box>

				<Box fontScale='s2'>{t('Details')}</Box>
				<Box display='flex' flexDirection='row'>{description}</Box>
			</Margins>
		</Box>
		{bundledIn && <>
			<Divider />
			<Box display='flex' flexDirection='column'>
				<Margins block='x12'>
					<Box fontScale='s2'>{t('Bundles')}</Box>
					{bundledIn.map((bundle) => <Box key={bundle.bundleId} display='flex' flexDirection='row' alignItems='center'>
						<Box width='x80' height='x80' display='flex' flexDirection='row' justifyContent='space-around' flexWrap='wrap' flexShrink={0}>
							{bundle.apps.map((app) => <AppAvatar size='x36' key={app.latest.name} iconFileContent={app.latest.iconFileContent} iconFileData={app.latest.iconFileData}/>)}
						</Box>
						<Box display='flex' flexDirection='column' mis='x12'>
							<Box fontScale='p2'>{bundle.bundleName}</Box>
							{bundle.apps.map((app) => <Box key={app.latest.name}>{app.latest.name},</Box>)}
						</Box>
					</Box>)}
				</Margins>
			</Box>
		</>}
	</>;
};

export default AppDetailsPageContent;
