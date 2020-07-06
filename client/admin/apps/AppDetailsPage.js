import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Button, ButtonGroup, Icon, Box, Divider, Chip, Margins, Skeleton, Throbber } from '@rocket.chat/fuselage';

import Page from '../../components/basic/Page';
import AppAvatar from '../../components/basic/avatar/AppAvatar';
import ExternalLink from '../../components/basic/ExternalLink';
import PriceDisplay from './PriceDisplay';
import AppStatus from './AppStatus';
import AppMenu from './AppMenu';
import { useRoute, useCurrentRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useAppInfo } from './hooks/useAppInfo';
import { useAbsoluteUrl } from '../../contexts/ServerContext';
import { Apps } from '../../../app/apps/client/orchestrator';
import { useForm } from '../../hooks/useForm';
import { handleAPIError, apiCurlGetter } from './helpers';
import { AppSettingsAssembler } from './AppSettings';

function AppDetailsPageContent({ data }) {
	const t = useTranslation();

	const {
		iconFileData = '',
		name,
		author: { name: authorName, homepage, support } = {},
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
			<AppAvatar size='x120' mie='x20' iconFileContent={iconFileContent} iconFileData={iconFileData}/>
			<Box display='flex' flexDirection='column' justifyContent='space-between' flexGrow={1}>
				<Box fontScale='h1'>{name}</Box>
				<Box display='flex' flexDirection='row' color='hint' alignItems='center'>
					<Box fontScale='p2' mie='x4'>{t('By_author', { author: authorName })}</Box>
					|
					<Box mis= 'x4'>{t('Version_version', { version })}</Box>
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
					{categories && categories.map((current) => <Chip key={current} textTransform='uppercase' mie='x8'><Box color='hint'>{current}</Box></Chip>)}
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
}

const SettingsDisplay = ({ settings, setHasUnsavedChanges, settingsRef }) => {
	const t = useTranslation();
	const reducedSettings = useMemo(() => Object.values(settings).reduce((ret, { id, value, packageValue }) => {
		ret = { ...ret, [id]: value ?? packageValue };
		return ret;
	}, {}), [JSON.stringify(settings)]);

	const { values, handlers, hasUnsavedChanges } = useForm(reducedSettings);

	useEffect(() => {
		setHasUnsavedChanges(hasUnsavedChanges);
		settingsRef.current = values;
	}, [hasUnsavedChanges, JSON.stringify(values), setHasUnsavedChanges]);

	return <>
		<Divider />
		<Box display='flex' flexDirection='column'>
			<Box fontScale='s2' mb='x12'>{t('Settings')}</Box>
			<AppSettingsAssembler settings={settings} values={values} handlers={handlers}/>
		</Box>
	</>;
};

const APIsDisplay = ({ apis }) => {
	const t = useTranslation();

	const absoluteUrl = useAbsoluteUrl();

	const getApiCurl = apiCurlGetter(absoluteUrl);

	return <>
		<Divider />
		<Box display='flex' flexDirection='column'>
			<Box fontScale='s2' mb='x12'>{t('APIs')}</Box>
			{apis.map((api) => <Box mb='x8'>
				<Box fontScale='p2'>{api.methods.join(' | ').toUpperCase()} {api.path}</Box>
				{api.methods.map((method) => <Box>
					<Box withRichContent><pre><code>
						{getApiCurl(method, api).map((curlAddress) => <>{curlAddress}<br /></>)}
					</code></pre></Box>
				</Box>)}
			</Box>)}
		</Box>
	</>;
};

const LoadingDetails = () => <Box display='flex' flexDirection='row' mbe='x20' w='full'>
	<Skeleton variant='rect' w='x120' h='x120' mie='x20'/>
	<Box display='flex' flexDirection='column' justifyContent='space-between' flexGrow={1}>
		<Skeleton variant='rect' w='full' h='x32'/>
		<Skeleton variant='rect' w='full' h='x32'/>
		<Skeleton variant='rect' w='full' h='x32'/>
	</Box>
</Box>;

export default function AppDetailsPage({ id }) {
	const t = useTranslation();

	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const settingsRef = useRef({});

	const data = useAppInfo(id);

	const [currentRouteName] = useCurrentRoute();
	const router = useRoute(currentRouteName);
	const handleReturn = () => router.push({});

	const isLoading = Object.values(data).length === 0;

	const { settings = {}, apis = {} } = data;

	const showSettings = Object.values(settings).length;
	const showApis = apis.length;

	const saveAppSettings = useCallback(async () => {
		const { current } = settingsRef;
		setIsSaving(true);
		try {
			await Apps.setAppSettings(id, Object.values(settings).map((value) => ({ ...value, value: current[value.id] })));
		} catch (e) {
			handleAPIError(e);
		}
		setIsSaving(false);
	}, [id, settings]);

	return <Page flexDirection='column'>
		<Page.Header title={t('App_Details')}>
			<ButtonGroup>
				<Button primary disabled={!hasUnsavedChanges || isSaving} onClick={saveAppSettings}>
					{!isSaving && t('Save_changes')}
					{isSaving && <Throbber inheritColor/>}
				</Button>
				<Button onClick={handleReturn}>
					<Icon name='back'/>
					{t('Back')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow >
			<Box maxWidth='x600' w='full' alignSelf='center'>
				{isLoading && <LoadingDetails />}
				{!isLoading && <>
					<AppDetailsPageContent data={data} />
					{!!showApis && <APIsDisplay apis={apis}/>}
					{!!showSettings && <SettingsDisplay settings={settings} setHasUnsavedChanges={setHasUnsavedChanges} settingsRef={settingsRef}/>}
				</>}
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
}
