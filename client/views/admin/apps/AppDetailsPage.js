import React, { useState, useCallback, useRef } from 'react';
import { Button, ButtonGroup, Icon, Box, Throbber } from '@rocket.chat/fuselage';

import Page from '../../../components/Page';
import { useRoute, useCurrentRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useAppInfo } from './hooks/useAppInfo';
import { Apps } from '../../../../app/apps/client/orchestrator';
import { handleAPIError } from './helpers';
import AppDetailsPageContent from './AppDetailsPageContent';
import SettingsDisplay from './SettingsDisplay';
import APIsDisplay from './APIsDisplay';
import LoadingDetails from './LoadingDetails';

function AppDetailsPage({ id }) {
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

export default AppDetailsPage;
