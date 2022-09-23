import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { Button, ButtonGroup, Box, Throbber } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useCurrentRoute, useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import React, { useState, useCallback, useRef, ReactElement } from 'react';

import { ISettings } from '../../../../app/apps/client/@types/IOrchestrator';
import { Apps } from '../../../../app/apps/client/orchestrator';
import Page from '../../../components/Page';
import AppDetails from './AppDetails';
import AppDetailsHeader from './AppDetailsHeader';
import AppDetailsTabs from './AppDetailsTabs';
import AppLogs from './AppLogs';
import AppReleases from './AppReleases';
import AppSecurity from './AppSecurity';
import LoadingDetails from './LoadingDetails';
import SettingsDisplay from './SettingsDisplay';
import { handleAPIError } from './helpers';
import { useAppInfo } from './hooks/useAppInfo';

type AppDetailsPageProps = { id: string; isAdminSection: boolean };

const AppDetailsPage = function AppDetailsPage({ id, isAdminSection }: AppDetailsPageProps): ReactElement {
	const t = useTranslation();

	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const settingsRef = useRef<Record<string, ISetting['value']>>({});
	const appData = useAppInfo(id);

	const [routeName] = useCurrentRoute();
	const tab = useRouteParameter('tab');
	const context = useRouteParameter('context');

	if (!routeName) {
		throw new Error('No current route name');
	}
	const router = useRoute(routeName);
	const handleReturn = useMutableCallback((): void => {
		const page = 'list';
		if (context === 'all') {
			router.push({ context: 'all', page });
		}

		if (context === 'enterprise') {
			router.push({ context: 'enterprise', page });
		}

		if (context === 'installed') {
			router.push({ context: 'installed', page });
		}
	});

	const { settings, privacyPolicySummary, permissions, tosLink, privacyLink } = appData || {};

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
		} catch (e: any) {
			handleAPIError(e);
		}
		setIsSaving(false);
	}, [id, settings]);

	const isSecurityVisible = Boolean(privacyPolicySummary || permissions || tosLink || privacyLink);

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
							<AppDetailsHeader app={appData} isAdminSection={isAdminSection} />

							<AppDetailsTabs appData={appData} isSecurityVisible={isSecurityVisible} isAdminSection={isAdminSection} />

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
								<SettingsDisplay
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
