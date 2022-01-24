import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { Button, ButtonGroup, Icon, Box, Throbber } from '@rocket.chat/fuselage';
import React, { useState, useCallback, useRef, FC } from 'react';

import { Apps } from '../../../../app/apps/client/orchestrator';
import Page from '../../../components/Page';
import { useRoute, useCurrentRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import APIsDisplay from './APIsDisplay';
import AppDetailsPageContent from './AppDetailsPageContent';
import LoadingDetails from './LoadingDetails';
import SettingsDisplay from './SettingsDisplay';
import { handleAPIError } from './helpers';
import { useAppInfo } from './hooks/useAppInfo';

const AppDetailsPage: FC<{ id: string }> = function AppDetailsPage({ id }) {
	const t = useTranslation();

	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const settingsRef = useRef<Record<string, ISetting['value']>>({});

	const data = useAppInfo(id);

	const [currentRouteName] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No current route name');
	}
	const router = useRoute(currentRouteName);
	const handleReturn = (): void => router.push({});

	const { settings, apis } = { settings: {}, apis: [], ...data };

	const showSettings = Object.values(settings).length;
	const showApis = apis.length;

	const saveAppSettings = useCallback(async () => {
		const { current } = settingsRef;
		setIsSaving(true);
		try {
			await Apps.setAppSettings(
				id,
				Object.values(settings).map((value) => ({ ...value, value: current?.[value.id] })),
			);
		} catch (e) {
			handleAPIError(e);
		}
		setIsSaving(false);
	}, [id, settings]);

	return (
		<Page flexDirection='column'>
			<Page.Header title={t('App_Details')}>
				<ButtonGroup>
					<Button primary disabled={!hasUnsavedChanges || isSaving} onClick={saveAppSettings}>
						{!isSaving && t('Save_changes')}
						{isSaving && <Throbber inheritColor />}
					</Button>
					<Button onClick={handleReturn}>
						<Icon name='back' />
						{t('Back')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					{!data && <LoadingDetails />}
					{data && (
						<>
							<AppDetailsPageContent app={data} />
							{!!showApis && <APIsDisplay apis={apis} />}
							{!!showSettings && (
								<SettingsDisplay settings={settings} setHasUnsavedChanges={setHasUnsavedChanges} settingsRef={settingsRef} />
							)}
						</>
					)}
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default AppDetailsPage;
