import type { SelectOption } from '@rocket.chat/fuselage';
import { SelectLegacy, Box, Button, Field, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useId, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useRemoveWebDAVAccountIntegrationMutation } from './hooks/useRemoveWebDAVAccountIntegrationMutation';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import { useWebDAVAccountIntegrationsQuery } from '../../../hooks/webdav/useWebDAVAccountIntegrationsQuery';
import { getWebdavServerName } from '../../../lib/getWebdavServerName';

const AccountIntegrationsPage = () => {
	const { data: webdavAccountIntegrations } = useWebDAVAccountIntegrationsQuery();

	const {
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<{ accountSelected: string }>();

	const options: SelectOption[] = useMemo(
		() => webdavAccountIntegrations?.map(({ _id, ...current }) => [_id, getWebdavServerName(current)]) ?? [],
		[webdavAccountIntegrations],
	);

	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const removeMutation = useRemoveWebDAVAccountIntegrationMutation({
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Webdav_account_removed') });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleSubmitForm = useEffectEvent(({ accountSelected }: { accountSelected: string }) => {
		removeMutation.mutate({ accountSelected });
	});

	const accountSelectedId = useId();

	return (
		<Page>
			<PageHeader title={t('Integrations')} />
			<PageScrollableContentWithShadow>
				<Box is='form' maxWidth='x600' w='full' alignSelf='center' onSubmit={handleSubmit(handleSubmitForm)}>
					<Field>
						<FieldLabel>{t('WebDAV_Accounts')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='accountSelected'
								rules={{ required: t('Required_field', { field: t('WebDAV_Accounts') }) }}
								render={({ field }) => <SelectLegacy {...field} options={options} placeholder={t('Select_an_option')} />}
							/>
							<Button type='submit' danger>
								{t('Remove')}
							</Button>
						</FieldRow>
						{errors?.accountSelected && (
							<FieldError aria-live='assertive' id={`${accountSelectedId}-error`}>
								{errors.accountSelected.message}
							</FieldError>
						)}
					</Field>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default AccountIntegrationsPage;
