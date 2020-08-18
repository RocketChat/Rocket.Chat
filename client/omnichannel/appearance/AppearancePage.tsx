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

type LivechatAppearanceSettings = {
	Livechat_title: string;
	Livechat_title_color: string;
	Livechat_show_agent_info: boolean;
	Livechat_show_agent_email: boolean;
	Livechat_display_offline_form: boolean;
	Livechat_offline_form_unavailable: string;
	Livechat_offline_message: string;
	Livechat_offline_title: string;
	Livechat_offline_title_color: string;
	Livechat_offline_email: string;
	Livechat_offline_success_message: string;
	Livechat_registration_form: boolean;
	Livechat_name_field_registration_form: boolean;
	Livechat_email_field_registration_form: boolean;
	Livechat_registration_form_message: string;
	Livechat_conversation_finished_message: string;
	Livechat_conversation_finished_text: string;
	Livechat_enable_message_character_limit: boolean;
	Livechat_message_character_limit: number;
};

type AppearanceSettings = Partial<LivechatAppearanceSettings>;

const reduceAppearance = (settings: LivechatAppearanceEndpointData['appearance']): AppearanceSettings =>
	settings.reduce<Partial<LivechatAppearanceSettings>>((acc, { _id, value }) => {
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

	return <AppearancePage settings={data.appearance}/>;
};

type AppearancePageProps = {
	settings: LivechatAppearanceEndpointData['appearance'];
};

const AppearancePage: FC<AppearancePageProps> = ({ settings }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const save: (settings: Pick<ISetting, '_id' | 'value'>[]) => Promise<void> = useMethod('livechat:saveAppearance');

	const { values, handlers, commit, reset, hasUnsavedChanges } = useForm(reduceAppearance(settings));

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
