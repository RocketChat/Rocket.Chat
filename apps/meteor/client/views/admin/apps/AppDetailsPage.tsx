import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { Button, ButtonGroup, Box, Throbber, Tabs } from '@rocket.chat/fuselage';
import React, { useState, useCallback, useRef, FC, MouseEventHandler } from 'react';

import { Apps } from '../../../../app/apps/client/orchestrator';
import Page from '../../../components/Page';
import { useTranslation } from '../../../contexts/TranslationContext';
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
	const [selectedTab, setSelectedTab] = useState({
		isSelectedDetails: true,
		isSelectedLogs: false,
		isSelectedSettings: false,
	});

	const settingsRef = useRef<Record<string, ISetting['value']>>({});

	const data = useAppInfo(id);

	const { settings, apis } = { settings: {}, apis: [], ...data };

	const showApis = apis.length;
	const { installed } = data || {};

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

	const isClickedTabDetails = useCallback(
		(e: React.MouseEvent<HTMLElement, MouseEvent>): boolean => e.currentTarget.innerText === t('Details'),
		[t],
	);

	const isClickedTabLogs = useCallback(
		(e: React.MouseEvent<HTMLElement, MouseEvent>): boolean => e.currentTarget.innerText === t('Logs'),
		[t],
	);

	const isClickedTabSettings = useCallback(
		(e: React.MouseEvent<HTMLElement, MouseEvent>): boolean => e.currentTarget.innerText === t('Settings'),
		[t],
	);

	const selectTab: MouseEventHandler<HTMLElement> = useCallback(
		(e) => {
			setSelectedTab({
				isSelectedDetails: isClickedTabDetails(e),
				isSelectedLogs: isClickedTabLogs(e),
				isSelectedSettings: isClickedTabSettings(e),
			});
		},
		[isClickedTabDetails, isClickedTabLogs, isClickedTabSettings],
	);

	const { isSelectedDetails, isSelectedLogs, isSelectedSettings } = selectedTab;

	const isDetailsTabSelected = isSelectedDetails;
	const areApisVisible = Boolean(isSelectedDetails && !!showApis);

	const isLogsTabSelected = isSelectedLogs;
	const isLogsTabEnabled = Boolean(installed);

	const isSettingsTabSelected = Boolean(isSelectedSettings && settings && Object.values(settings).length);
	const isSettingsTabEnabled = Boolean(installed && settings && Object.values(settings).length);

	return (
		<Page flexDirection='column'>
			<Page.Header title={t('Back')} isAppDetails>
				<ButtonGroup>
					<Button primary disabled={!hasUnsavedChanges || isSaving} onClick={saveAppSettings}>
						{!isSaving && t('Save_changes')}
						{isSaving && <Throbber inheritColor />}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow padding='x24'>
				<Box w='full' alignSelf='center'>
					{!data && <LoadingDetails />}
					{data && (
						<>
							<AppDetailsHeader app={data} />

							<Tabs mis='-x24' mb='x36'>
								<Tabs.Item onClick={selectTab} selected={isSelectedDetails}>
									{t('Details')}
								</Tabs.Item>
								{isLogsTabEnabled && (
									<Tabs.Item onClick={selectTab} selected={isSelectedLogs}>
										{t('Logs')}
									</Tabs.Item>
								)}
								{isSettingsTabEnabled && (
									<Tabs.Item onClick={selectTab} selected={isSelectedSettings} disabled={!isSettingsTabEnabled}>
										{t('Settings')}
									</Tabs.Item>
								)}
							</Tabs>

							{isDetailsTabSelected && <AppDetailsPageContent app={data} />}
							{areApisVisible && <APIsDisplay apis={apis} />}
							{isLogsTabSelected && <AppLogsPage id={id} />}
							{isSettingsTabSelected && (
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
