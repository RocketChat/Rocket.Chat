import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { App } from '@rocket.chat/core-typings';
import { Button, ButtonGroup, Box, Throbber, Tabs } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useCurrentRoute, useRoute, useRouteParameter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState, useCallback, useRef } from 'react';

import type { ISettings } from '../../../../../app/apps/client/@types/IOrchestrator';
import { Apps } from '../../../../../app/apps/client/orchestrator';
import Page from '../../../../components/Page';
import { handleAPIError } from '../helpers';
import { useAppInfo } from '../hooks/useAppInfo';
import AppDetailsPageHeader from './AppDetailsPageHeader';
import AppDetailsPageLoading from './AppDetailsPageLoading';
import AppDetails from './tabs/AppDetails';
import AppLogs from './tabs/AppLogs';
import AppReleases from './tabs/AppReleases';
import AppSecurity from './tabs/AppSecurity';
import AppSettings from './tabs/AppSettings';

const AppDetailsPage = ({ id }: { id: App['id'] }): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const settingsRef = useRef<Record<string, ISetting['value']>>({});
	const appData = useAppInfo(id);

	const [currentRouteName] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No current route name');
	}
	const router = useRoute(currentRouteName);

	const [, urlParams] = useCurrentRoute();
	const tab = useRouteParameter('tab');
	const context = useRouteParameter('context');

	const handleReturn = useMutableCallback((): void => {
		context && router.push({ context, page: 'list' });
	});

	const { installed, settings, privacyPolicySummary, permissions, tosLink, privacyLink, marketplace, name } = appData || {};
	const isSecurityVisible = privacyPolicySummary || permissions || tosLink || privacyLink;

	const saveAppSettings = useCallback(async () => {
		const { current } = settingsRef;
		setIsSaving(true);
		try {
			await Apps.setAppSettings(
				id,
				(Object.values(settings || {}) as ISetting[]).map((value) => ({
					...value,
					value: current?.[value.id],
				})),
			);

			dispatchToastMessage({ type: 'success', message: `${name} settings saved succesfully` });
		} catch (e: any) {
			handleAPIError(e);
		}
		setIsSaving(false);
	}, [dispatchToastMessage, id, name, settings]);

	const handleTabClick = (tab: 'details' | 'security' | 'releases' | 'settings' | 'logs'): void => {
		router.replace({ ...urlParams, tab });
	};

	return (
		<Page flexDirection='column'>
			<Page.Header title={t('App_Info')} onClickBack={handleReturn}>
				<ButtonGroup>
					{installed && (
						<Button primary disabled={!hasUnsavedChanges || isSaving} onClick={saveAppSettings}>
							{!isSaving && t('Save_changes')}
							{isSaving && <Throbber inheritColor />}
						</Button>
					)}
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow padding='x24'>
				<Box w='full' alignSelf='center'>
					{!appData && <AppDetailsPageLoading />}
					{appData && (
						<>
							<AppDetailsPageHeader app={appData} />
							<Tabs>
								<Tabs.Item onClick={(): void => handleTabClick('details')} selected={!tab || tab === 'details'}>
									{t('Details')}
								</Tabs.Item>
								{Boolean(installed) && isSecurityVisible && (
									<Tabs.Item onClick={(): void => handleTabClick('security')} selected={tab === 'security'}>
										{t('Security')}
									</Tabs.Item>
								)}
								{Boolean(installed) && marketplace !== false && (
									<Tabs.Item onClick={(): void => handleTabClick('releases')} selected={tab === 'releases'}>
										{t('Releases')}
									</Tabs.Item>
								)}
								{Boolean(installed && settings && Object.values(settings).length) && (
									<Tabs.Item onClick={(): void => handleTabClick('settings')} selected={tab === 'settings'}>
										{t('Settings')}
									</Tabs.Item>
								)}
								{Boolean(installed) && (
									<Tabs.Item onClick={(): void => handleTabClick('logs')} selected={tab === 'logs'}>
										{t('Logs')}
									</Tabs.Item>
								)}
							</Tabs>
							{Boolean(!tab || tab === 'details') && <AppDetails app={appData} />}
							{tab === 'security' && isSecurityVisible && (
								<AppSecurity
									privacyPolicySummary={privacyPolicySummary}
									appPermissions={permissions}
									tosLink={tosLink}
									privacyLink={privacyLink}
								/>
							)}
							{tab === 'releases' && <AppReleases id={id} />}
							{Boolean(tab === 'settings' && settings && Object.values(settings).length) && (
								<AppSettings
									settings={settings || ({} as ISettings)}
									setHasUnsavedChanges={setHasUnsavedChanges}
									settingsRef={settingsRef}
								/>
							)}
							{tab === 'logs' && <AppLogs id={id} />}
						</>
					)}
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default AppDetailsPage;
