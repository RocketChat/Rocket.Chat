import type { ISetting, Serialized } from '@rocket.chat/core-typings';
import { ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AppearanceForm from './AppearanceForm';
import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '../../../components/Page';

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
	Omnichannel_allow_visitors_to_close_conversation: boolean;
};

type AppearanceSettings = Partial<LivechatAppearanceSettings>;

const reduceAppearance = (settings: Serialized<ISetting>[]): AppearanceSettings =>
	settings.reduce<Partial<LivechatAppearanceSettings>>((acc, { _id, value }) => {
		acc = { ...acc, [_id]: value };
		return acc;
	}, {});

const AppearancePage = ({ settings }: { settings: Serialized<ISetting>[] }) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const saveAction = useEndpoint('POST', '/v1/livechat/appearance');

	const methods = useForm<LivechatAppearanceSettings>({ defaultValues: reduceAppearance(settings) });
	const {
		reset,
		formState: { isDirty },
		handleSubmit,
		watch,
	} = methods;

	const currentData = watch();

	const handleSave = useEffectEvent(async (data: LivechatAppearanceSettings) => {
		const mappedAppearance = Object.entries(data)
			.map(([_id, value]) => ({ _id, value }))
			.filter((item) => item.value !== undefined) as {
			_id: string;
			value: string | boolean | number;
		}[];

		try {
			await saveAction(mappedAppearance);
			dispatchToastMessage({ type: 'success', message: t('Settings_updated') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			reset(currentData);
		}
	});

	const formId = useId();

	return (
		<Page>
			<PageHeader title={t('Appearance')} />
			<PageScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					<FormProvider {...methods}>
						<form id={formId} onSubmit={handleSubmit(handleSave)}>
							<AppearanceForm />
						</form>
					</FormProvider>
				</Box>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset()}>{t('Cancel')}</Button>
					<Button form={formId} type='submit' primary>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default AppearancePage;
