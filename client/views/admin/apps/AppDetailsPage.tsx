import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { Button, ButtonGroup, Icon, Box, Throbber, Tabs } from '@rocket.chat/fuselage';
import React, { useState, useCallback, useRef, FC } from 'react';

import { Apps } from '../../../../app/apps/client/orchestrator';
import Page from '../../../components/Page';
import AppAvatar from '../../../components/avatar/AppAvatar';
import { useRoute, useCurrentRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import APIsDisplay from './APIsDisplay';
import AppDetailsPageContent from './AppDetailsPageContent';
import AppMenu from './AppMenu';
import AppStatus from './AppStatus';
import LoadingDetails from './LoadingDetails';
import PriceDisplay from './PriceDisplay';
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

	const { iconFileData = '', name, author, version, price, purchaseType, pricingPlans, iconFileContent, installed } = data || {};

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
			<Page.ScrollableContentWithShadow padding='x24'>
				<Box w='full' alignSelf='center'>
					{!data && <LoadingDetails />}
					{data && (
						<>
							<Box display='flex' flexDirection='row' mbe='x20' w='full'>
								<AppAvatar size='x124' mie='x20' iconFileContent={iconFileContent} iconFileData={iconFileData} />
								<Box display='flex' flexDirection='column' justifyContent='space-between' flexGrow={1}>
									<Box fontScale='h2'>{name}</Box>
									<Box display='flex' flexDirection='row' color='hint' alignItems='center'>
										<Box fontScale='p2m' mie='x4'>
											{t('By_author', { author: author?.name })}
										</Box>
										|<Box mis='x4'>{t('Version_version', { version })}</Box>
									</Box>
									<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
										<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' marginInline='neg-x8'>
											<AppStatus app={data} marginInline='x8' />
											{!installed && (
												<PriceDisplay
													purchaseType={purchaseType}
													pricingPlans={pricingPlans}
													price={price}
													showType={false}
													marginInline='x8'
												/>
											)}
										</Box>
										{installed && <AppMenu app={data} />}
									</Box>
								</Box>
							</Box>

							<Tabs mis='-x24' mb='x36'>
								<Tabs.Item selected>{t('Details')}</Tabs.Item>
								<Tabs.Item>{t('Logs')}</Tabs.Item>
								<Tabs.Item>{t('Settings')}</Tabs.Item>
							</Tabs>

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
