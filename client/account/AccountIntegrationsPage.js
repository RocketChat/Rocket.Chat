import React, { useMemo, useCallback } from 'react';
import { Box, Select, Field, Button } from '@rocket.chat/fuselage';

import { useReactiveValue } from '../hooks/useReactiveValue';
import { useTranslation } from '../contexts/TranslationContext';
import { useMethod } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';
import { WebdavAccounts } from '../../app/models';
import { useForm } from '../hooks/useForm';
import Page from '../components/basic/Page';

const getWebdavAccounts = () => WebdavAccounts.find().fetch();

const getServerName = ({ name, server_url, username }) => name || `${ username }@${ server_url.replace(/^https?\:\/\//i, '') }`;

const AccountIntegrationsPage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const accounts = useReactiveValue(getWebdavAccounts);

	const { values, handlers } = useForm({ selected: [] });

	const { selected } = values;
	const { handleSelected } = handlers;

	const removeWebdavAccount = useMethod('removeWebdavAccount');

	const options = useMemo(() => accounts.map(({ _id, ...current }) => [_id, getServerName(current)]), [accounts]);

	const handleClickRemove = useCallback(() => {
		try {
			removeWebdavAccount(selected);
			dispatchToastMessage({ type: 'success', message: t('webdav-account-removed') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, removeWebdavAccount, selected, t]);

	return <Page>
		<Page.Header title={t('Integrations')} />
		<Page.ScrollableContentWithShadow>
			<Box maxWidth='x600' w='full' alignSelf='center'>
				<Field>
					<Field.Label>{t('WebDAV_Accounts')}</Field.Label>
					<Field.Row>
						<Select options={options} onChange={handleSelected} value={selected} placeholder={t('Select_an_option')}/>
						<Button primary danger onClick={handleClickRemove}>{t('Remove')}</Button>
					</Field.Row>
				</Field>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default AccountIntegrationsPage;
