import type { SelectOption } from '@rocket.chat/fuselage';
import { SelectLegacy, Box, Button, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import { useWebDAVAccountIntegrationsQuery } from '../../../hooks/webdav/useWebDAVAccountIntegrationsQuery';
import { getWebdavServerName } from '../../../lib/getWebdavServerName';
import { useRemoveWebDAVAccountIntegrationMutation } from './hooks/useRemoveWebDAVAccountIntegrationMutation';

const AccountIntegrationsPage = () => {
	const { data: webdavAccountIntegrations } = useWebDAVAccountIntegrationsQuery();

	const { handleSubmit, control } = useForm<{ accountSelected: string }>();

	const options: SelectOption[] = useMemo(
		() => webdavAccountIntegrations?.map(({ _id, ...current }) => [_id, getWebdavServerName(current)]) ?? [],
		[webdavAccountIntegrations],
	);

	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const removeMutation = useRemoveWebDAVAccountIntegrationMutation({
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Webdav_account_removed') });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleSubmitForm = useEffectEvent(({ accountSelected }) => {
		removeMutation.mutate({ accountSelected });
	});

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
								rules={{ required: true }}
								render={({ field: { onChange, value, name, ref } }) => (
									<SelectLegacy
										ref={ref}
										name={name}
										options={options}
										onChange={onChange}
										value={value}
										placeholder={t('Select_an_option')}
									/>
								)}
							/>
							<Button type='submit' danger>
								{t('Remove')}
							</Button>
						</FieldRow>
					</Field>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default AccountIntegrationsPage;
