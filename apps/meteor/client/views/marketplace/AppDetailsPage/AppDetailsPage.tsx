import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { App, SettingValue } from '@rocket.chat/core-typings';
import { Button, ButtonGroup, Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useRouteParameter, useToastMessageDispatch, usePermission, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useMemo, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import AppDetailsPageHeader from './AppDetailsPageHeader';
import AppDetailsPageLoading from './AppDetailsPageLoading';
import AppDetailsPageTabs from './AppDetailsPageTabs';
import { handleAPIError } from '../helpers/handleAPIError';
import { useAppInfo } from '../hooks/useAppInfo';
import AppDetails from './tabs/AppDetails';
import AppInstances from './tabs/AppInstances';
import AppLogs from './tabs/AppLogs';
import AppSchedulerJobs from './tabs/AppSchedulerJobs';
import { AppLogsFilterContextualBar } from './tabs/AppLogs/Filters/AppLogsFilterContextualBar';
import { useAppLogsFilterForm } from './tabs/AppLogs/useAppLogsFilterForm';
import AppReleases from './tabs/AppReleases';
import AppRequests from './tabs/AppRequests/AppRequests';
import AppSecurity from './tabs/AppSecurity/AppSecurity';
import AppSettings from './tabs/AppSettings';
import { useCompactMode } from './useCompactMode';
import { AppClientOrchestratorInstance } from '../../../apps/orchestrator';
import { Page, PageFooter, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';

type AppDetailsPageFormData = Record<string, SettingValue>;

type AppDetailsPageProps = {
	id: App['id'];
};

const AppDetailsPage = ({ id }: AppDetailsPageProps): ReactElement => {
	const t = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const isAdminUser = usePermission('manage-apps');

	const tab = useRouteParameter('tab');
	const context = useRouteParameter('context');
	const contextualBar = useRouteParameter('contextualBar');
	const appData = useAppInfo(id, context || '');
	const compactMode = useCompactMode();

	const handleReturn = useEffectEvent((): void => {
		if (!context) {
			return;
		}

		router.navigate({
			name: 'marketplace',
			params: { context, page: 'list' },
		});
	});

	const handleReturnToLogs = useEffectEvent((): void => {
		if (!context) {
			return;
		}

		router.navigate(
			{
				name: 'marketplace',
				params: { ...router.getRouteParameters(), contextualBar: '' },
			},
			{ replace: true },
		);
	});

	const { installed, settings, privacyPolicySummary, permissions, tosLink, privacyLink, name } = appData || {};
	const isSecurityVisible = Boolean(privacyPolicySummary || permissions || tosLink || privacyLink);

	const reducedSettings = useMemo((): AppDetailsPageFormData => {
		return Object.values(settings || {}).reduce(
			(ret: AppDetailsPageFormData, { id, value, packageValue }) => ({ ...ret, [id]: value ?? packageValue }),
			{},
		);
	}, [settings]);

	const settingsFormMethods = useForm<AppDetailsPageFormData>({ values: reducedSettings });
	const {
		handleSubmit,
		reset,
		formState: { isDirty, isSubmitting },
	} = settingsFormMethods;

	const logsFilterFormMethods = useAppLogsFilterForm();

	const saveAppSettings = useCallback(
		async (data: AppDetailsPageFormData) => {
			try {
				await AppClientOrchestratorInstance.setAppSettings(
					id,
					(Object.values(settings || {}) as ISetting[]).map((setting) => ({
						...setting,
						value: data[setting.id],
					})),
				);
				reset(data);
				dispatchToastMessage({ type: 'success', message: t('App_Settings_Saved_Successfully', { appName: name }) });
			} catch (e: any) {
				handleAPIError(e);
			}
		},
		[id, settings, reset, dispatchToastMessage, t, name],
	);

	return (
		<Page flexDirection='row'>
			<Page flexDirection='column' h='full'>
				<PageHeader title={t('App_Info')} onClickBack={handleReturn} />
				<PageScrollableContentWithShadow pi={24} pbs={24} pbe={0} h='full'>
					<Box w='full' alignSelf='center' h='full' display='flex' flexDirection='column'>
						{!appData && <AppDetailsPageLoading />}
						{appData && (
							<>
								<AppDetailsPageHeader app={appData} />
								<AppDetailsPageTabs
									context={context || ''}
									installed={installed}
									isSecurityVisible={isSecurityVisible}
									settings={settings}
									tab={tab}
									hasCluster={!!appData.clusterStatus}
								/>
								{Boolean(!tab || tab === 'details') && <AppDetails app={appData} />}
								{tab === 'requests' && <AppRequests id={id} isAdminUser={isAdminUser} />}
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
									<FormProvider {...settingsFormMethods}>
										<AppSettings settings={settings || {}} />
									</FormProvider>
								)}
								{(tab === 'logs' || tab === 'logs-filter') && (
									<FormProvider {...logsFilterFormMethods}>
										<AppLogs id={id} />
									</FormProvider>
								)}
								{tab === 'instances' && <AppInstances id={id} />}
								{tab === 'scheduler-jobs' && <AppSchedulerJobs id={id} />}
							</>
						)}
					</Box>
				</PageScrollableContentWithShadow>
				<PageFooter isDirty={isDirty}>
					<ButtonGroup>
						<Button onClick={() => reset()}>{t('Cancel')}</Button>
						{installed && isAdminUser && (
							<Button primary loading={isSubmitting} onClick={handleSubmit(saveAppSettings)}>
								{t('Save_changes')}
							</Button>
						)}
					</ButtonGroup>
				</PageFooter>
			</Page>
			{compactMode && contextualBar === 'filter-logs' && (
				<FormProvider {...logsFilterFormMethods}>
					<AppLogsFilterContextualBar appId={id} onClose={handleReturnToLogs} />
				</FormProvider>
			)}
		</Page>
	);
};

export default AppDetailsPage;
