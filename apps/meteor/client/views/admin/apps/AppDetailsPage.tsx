import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { Button, ButtonGroup, Box, Throbber, Tabs } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useCurrentRoute, useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import React, { useState, useCallback, useRef, FC } from 'react';

import { ISettings, ISettingsPayload } from '../../../../app/apps/client/@types/IOrchestrator';
import { Apps } from '../../../../app/apps/client/orchestrator';
import Page from '../../../components/Page';
import APIsDisplay from './APIsDisplay';
import AppDetailsHeader from './AppDetailsHeader';
import AppDetailsPageContent from './AppDetailsPageContent';
import AppLogsPage from './AppLogsPage';
import LoadingDetails from './LoadingDetails';
import SettingsDisplay from './SettingsDisplay';
import { handleAPIError } from './helpers';
import { useAppInfo } from './hooks/useAppInfo';

const AppDetailsPage: FC<{ id: string }> = function AppDetailsPage({ id }) {
	const t = useTranslation();

	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const settingsRef = useRef<Record<string, ISetting['value']>>({});
	const appData = useAppInfo(id);

	const [, urlParams] = useCurrentRoute();
	const appsRoute = useRoute('admin-apps');
	const tab = useRouteParameter('tab');

	const [currentRouteName] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No current route name');
	}

	const router = useRoute(currentRouteName);
	const handleReturn = useMutableCallback((): void => router.push({}));

	const { installed, settings, apis } = appData || {};
	const showApis = apis?.length;

	const saveAppSettings = useCallback(async () => {
		const { current } = settingsRef;
		setIsSaving(true);
		try {
			await Apps.setAppSettings(
				id,
				(Object.values(settings || {}) as ISetting[]).map((value) => ({
					...value,
					value: current?.[value.id],
				})) as unknown as ISettingsPayload,
			);
		} catch (e) {
			handleAPIError(e);
		}
		setIsSaving(false);
	}, [id, settings]);

	const handleTabClick = (tab: 'details' | 'logs' | 'settings'): void => {
		appsRoute.replace({ ...urlParams, tab });
	};

	return (
		<Page flexDirection='column'>
			<Page.Header title={t('App_Info')} onClickBack={handleReturn}>
				<ButtonGroup>
					<Button primary disabled={!hasUnsavedChanges || isSaving} onClick={saveAppSettings}>
						{!isSaving && t('Save_changes')}
						{isSaving && <Throbber inheritColor />}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow padding='x24'>
				<Box w='full' alignSelf='center'>
					{!appData && <LoadingDetails />}
					{appData && (
						<>
							<AppDetailsHeader app={appData} />

							<Tabs mis='-x24' mb='x36'>
								<Tabs.Item onClick={(): void => handleTabClick('details')} selected={!tab || tab === 'details'}>
									{t('Details')}
								</Tabs.Item>
								{Boolean(installed) && (
									<Tabs.Item onClick={(): void => handleTabClick('logs')} selected={tab === 'logs'}>
										{t('Logs')}
									</Tabs.Item>
								)}
								{Boolean(installed && settings && Object.values(settings).length) && (
									<Tabs.Item onClick={(): void => handleTabClick('settings')} selected={tab === 'settings'}>
										{t('Settings')}
									</Tabs.Item>
								)}
							</Tabs>

							{Boolean(!tab || tab === 'details') && <AppDetailsPageContent app={appData} />}
							{Boolean((!tab || tab === 'details') && !!showApis) && <APIsDisplay apis={apis || []} />}
							{tab === 'logs' && <AppLogsPage id={id} />}
							{Boolean(tab === 'settings' && settings && Object.values(settings).length) && (
								<SettingsDisplay
									settings={settings || ({} as ISettings)}
									setHasUnsavedChanges={setHasUnsavedChanges}
									settingsRef={settingsRef}
								/>
							)}
						</>
					)}
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default AppDetailsPage;
