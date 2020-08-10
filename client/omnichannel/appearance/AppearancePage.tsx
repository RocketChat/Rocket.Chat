import React, { FC } from 'react';
import { Callout, ButtonGroup, Button, Icon, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../contexts/TranslationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { useForm } from '../../hooks/useForm';
import Page from '../../components/basic/Page';
import AppearanceForm from './AppearanceForm';
import PageSkeleton from '../../components/PageSkeleton';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import { ISetting } from '../../../definition/ISetting';

type LivechatAppearanceEndpointData = {
	success: boolean;
	appearance: ISetting[];
};

type AppearanceSettings = Record<ISetting['_id'], ISetting['value']>;

const reduceAppearance = (settings: LivechatAppearanceEndpointData['appearance']): AppearanceSettings =>
	settings.reduce<AppearanceSettings>((acc, { _id, value }) => {
		acc = { ...acc, [_id]: value };
		return acc;
	}, {});

const AppearancePageContainer: FC = () => {
	const t = useTranslation();

	const { data, state, error } = useEndpointDataExperimental<LivechatAppearanceEndpointData>('livechat/appearance');

	const canViewAppearance = usePermission('view-livechat-appearance');

	if (!canViewAppearance) {
		return <NotAuthorizedPage />;
	}

	if (state === ENDPOINT_STATES.LOADING) {
		return <PageSkeleton />;
	}

	if (!data || !data.success || !data.appearance || error) {
		return <Page>
			<Page.Header title={t('Edit_Custom_Field')} />
			<Page.ScrollableContentWithShadow>
				<Callout type='danger'>
					{t('Error')}
				</Callout>
			</Page.ScrollableContentWithShadow>
		</Page>;
	}

	return <AppearancePage settings={reduceAppearance(data.appearance)}/>;
};

type AppearancePageProps = {
	settings: ReturnType<typeof reduceAppearance>;
};

const AppearancePage: FC<AppearancePageProps> = ({ settings }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const save = useMethod('livechat:saveAppearance');

	const { values, handlers, commit, reset, hasUnsavedChanges } = useForm(settings);

	const handleSave = useMutableCallback(async () => {
		const mappedAppearance = Object.entries(values).map(([_id, value]) => ({ _id, value }));

		try {
			await save(mappedAppearance);
			dispatchToastMessage({ type: 'success', message: t('Settings_updated') });
			commit();
		} catch (error) {
			dispatchToastMessage({ type: 'success', message: error });
		}
	});

	const handleResetButtonClick = (): void => {
		reset();
	};

	return <Page>
		<Page.Header title={t('Appearance')}>
			<ButtonGroup align='end'>
				<Button onClick={handleResetButtonClick}>
					<Icon size='x16' name='back'/>{t('Back')}
				</Button>
				<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>
					{t('Save')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<Box maxWidth='x600' w='full' alignSelf='center'>
				<AppearanceForm values={values} handlers={handlers}/>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default AppearancePageContainer;
