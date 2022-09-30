import type { IWebdavAccountIntegration } from '@rocket.chat/core-typings';
import { Box, Select, SelectOption, Field, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, ReactElement } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { WebdavAccounts } from '../../../../app/models/client';
import Page from '../../../components/Page';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { getWebdavServerName } from '../../../lib/getWebdavServerName';

const getWebdavAccounts = (): IWebdavAccountIntegration[] => WebdavAccounts.find().fetch();

const AccountIntegrationsPage = (): ReactElement => {
	const t = useTranslation();
	const { handleSubmit, control } = useForm();
	const dispatchToastMessage = useToastMessageDispatch();
	const accounts = useReactiveValue(getWebdavAccounts);
	const removeWebdavAccount = useEndpoint('POST', '/v1/webdav.removeWebdavAccount');

	const options: SelectOption[] = useMemo(() => accounts?.map(({ _id, ...current }) => [_id, getWebdavServerName(current)]), [accounts]);

	const handleClickRemove = useMutableCallback(({ accountSelected }) => {
		try {
			removeWebdavAccount({ accountId: accountSelected });
			dispatchToastMessage({ type: 'success', message: t('Webdav_account_removed') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as Error });
		}
	});

	return (
		<Page>
			<Page.Header title={t('Integrations')} />
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					<Field>
						<Field.Label>{t('WebDAV_Accounts')}</Field.Label>
						<Field.Row>
							<Controller
								control={control}
								name='accountSelected'
								render={({ field: { onChange, value, name, ref } }): ReactElement => (
									<Select ref={ref} name={name} options={options} onChange={onChange} value={value} placeholder={t('Select_an_option')} />
								)}
							/>
							<Button danger onClick={handleSubmit(handleClickRemove)}>
								{t('Remove')}
							</Button>
						</Field.Row>
					</Field>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default AccountIntegrationsPage;
