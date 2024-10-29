import type { App, SettingValue } from '@rocket.chat/core-typings';
import { Button, ButtonGroup, Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useTranslation, usePermission, useRouter } from '@rocket.chat/ui-contexts';
import React from 'react';
import { FormProvider } from 'react-hook-form';

import AppDetailsPageHeader from './AppDetailsPageHeader';
import AppDetailsPageTabs from './AppDetailsPageTabs';
import { useSaveAppSettingsMutation } from '../hooks/useSaveAppSettingsMutation';
import AppDetails from './tabs/AppDetails';
import AppLogs from './tabs/AppLogs';
import AppReleases from './tabs/AppReleases';
import { useAppSettingsForm } from '../hooks/useAppSettingsForm';
import AppRequests from './tabs/AppRequests/AppRequests';
import { Page, PageFooter, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import { useAppDetailsPageTab } from '../hooks/useAppDetailsPageTab';
import { useAppQuery } from '../hooks/useAppQuery';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';
import AppSecurity from './tabs/AppSecurity/AppSecurity';
import AppSettings from './tabs/AppSettings';

type AppDetailsPageProps = {
	id: App['id'];
};

const AppDetailsPage = ({ id: appId }: AppDetailsPageProps) => {
	const t = useTranslation();
	const router = useRouter();
	const canManageApps = usePermission('manage-apps');

	const tab = useAppDetailsPageTab();
	const context = useMarketplaceContext();

	const handleBackButtonClick = useEffectEvent(() => {
		router.navigate({
			name: 'marketplace',
			params: { context, page: 'list' },
		});
	});

	const { data: app } = useAppQuery(appId);

	const settingsForm = useAppSettingsForm();
	const { handleSubmit, reset, formState } = settingsForm;

	const saveAppSettingsMutation = useSaveAppSettingsMutation(appId);

	const saveAppSettings = useEffectEvent(async (data: Record<string, SettingValue>) => {
		await saveAppSettingsMutation.mutateAsync(data);
		reset(data);
	});

	return (
		<Page flexDirection='column' h='full'>
			<PageHeader title={t('App_Info')} onClickBack={handleBackButtonClick} />
			<PageScrollableContentWithShadow pi={24} pbs={24} pbe={0} h='full'>
				<Box w='full' alignSelf='center' h='full' display='flex' flexDirection='column'>
					<AppDetailsPageHeader appId={appId} />
					<AppDetailsPageTabs appId={appId} />
					{tab === 'details' && <AppDetails appId={appId} />}
					{tab === 'requests' && <AppRequests appId={appId} />}
					{tab === 'security' && <AppSecurity appId={appId} />}
					{tab === 'releases' && <AppReleases appId={appId} />}
					{tab === 'settings' && (
						<FormProvider {...settingsForm}>
							<AppSettings appId={appId} />
						</FormProvider>
					)}
					{tab === 'logs' && <AppLogs appId={appId} />}
				</Box>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={formState.isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset()}>{t('Cancel')}</Button>
					{canManageApps && app?.installed && (
						<Button primary loading={formState.isSubmitting} onClick={handleSubmit(saveAppSettings)}>
							{t('Save_changes')}
						</Button>
					)}
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default AppDetailsPage;
