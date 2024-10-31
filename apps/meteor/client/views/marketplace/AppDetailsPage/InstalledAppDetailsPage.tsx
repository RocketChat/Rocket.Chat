import type { App, SettingValue } from '@rocket.chat/core-typings';
import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';
import { FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useAppDetailsPageTab } from '../hooks/useAppDetailsPageTab';
import { useAppSettingsForm } from '../hooks/useAppSettingsForm';
import { useSaveAppSettingsMutation } from '../hooks/useSaveAppSettingsMutation';
import AppDetailsPageHeader from './AppDetailsPageHeader';
import AppDetailsPageLayout from './AppDetailsPageLayout';
import AppDetailsPageTabs from './AppDetailsPageTabs';
import AppDetails from './tabs/AppDetails';
import AppLogs from './tabs/AppLogs';
import AppReleases from './tabs/AppReleases';
import AppRequests from './tabs/AppRequests/AppRequests';
import AppSecurity from './tabs/AppSecurity/AppSecurity';
import AppSettings from './tabs/AppSettings';

type InstalledAppDetailsPageProps = {
	app: App;
};

const InstalledAppDetailsPage = ({ app }: InstalledAppDetailsPageProps) => {
	const { t } = useTranslation();
	const canManageApps = usePermission('manage-apps');

	const [tab] = useAppDetailsPageTab();

	const settingsForm = useAppSettingsForm();
	const { handleSubmit, reset, formState } = settingsForm;

	const saveAppSettingsMutation = useSaveAppSettingsMutation(app.id);

	const saveAppSettings = useEffectEvent(async (data: Record<string, SettingValue>) => {
		await saveAppSettingsMutation.mutateAsync(data);
		reset(data);
	});

	return (
		<AppDetailsPageLayout
			footer={
				<ButtonGroup>
					<Button onClick={() => reset()}>{t('Cancel')}</Button>
					{canManageApps && (
						<Button primary loading={formState.isSubmitting} onClick={handleSubmit(saveAppSettings)}>
							{t('Save_changes')}
						</Button>
					)}
				</ButtonGroup>
			}
			footerShown={formState.isDirty}
		>
			<AppDetailsPageHeader app={app} />
			<AppDetailsPageTabs app={app} />
			{tab === 'details' && <AppDetails app={app} />}
			{tab === 'requests' && <AppRequests appId={app.id} />}
			{tab === 'security' && <AppSecurity app={app} />}
			{tab === 'releases' && <AppReleases appId={app.id} />}
			{tab === 'settings' && (
				<FormProvider {...settingsForm}>
					<AppSettings appId={app.id} />
				</FormProvider>
			)}
			{tab === 'logs' && <AppLogs appId={app.id} />}
		</AppDetailsPageLayout>
	);
};

export default InstalledAppDetailsPage;
