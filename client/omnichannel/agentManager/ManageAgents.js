import React, { useCallback, useState, useEffect } from 'react';
import { TextInput, Button, Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import { GenericTable } from '../../components/GenericTable';
import { UserAutoComplete } from '../../components/basic/AutoComplete';
import { useCurrentRoute } from '../../contexts/RouterContext';

const FilterByText = ({ setFilter, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [setFilter, text]);
	return <Box mb='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput flexShrink={0} placeholder={t('Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

function AddAgent({ reload, ...props }) {
	const t = useTranslation();
	const [username, setUsername] = useState();

	const saveAction = useEndpointAction('POST', 'livechat/users/agent', { username });

	const handleSave = useMutableCallback(async () => {
		if (!username) {
			return;
		}
		const result = await saveAction();
		if (!result.success) {
			return;
		}
		reload();
		setUsername();
	});
	return <Box display='flex' alignItems='center' {...props}>
		<UserAutoComplete value={username} onChange={setUsername}/>
		<Button disabled={!username} onClick={handleSave} mis='x8' primary>{t('Add')}</Button>
	</Box>;
}

function AddManager({ reload, ...props }) {
	const t = useTranslation();
	const [username, setUsername] = useState();

	const saveAction = useEndpointAction('POST', 'livechat/users/manager', { username });

	const handleSave = useMutableCallback(async () => {
		if (!username) {
			return;
		}
		const result = await saveAction();
		if (!result.success) {
			return;
		}
		reload();
		setUsername();
	});
	return <Box display='flex' alignItems='center' {...props}>
		<UserAutoComplete value={username} onChange={setUsername}/>
		<Button disabled={!username} onClick={handleSave} mis='x8' primary>{t('Add')}</Button>
	</Box>;
}

function ManageAgents({
	data,
	reload,
	header,
	setParams,
	params,
	title,
	renderRow,
	children,
}) {
	const currRoute = useCurrentRoute();
	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={title}/>
			{currRoute[0] === 'omnichannel-agents' && <AddAgent reload={reload} pi='x24'/>}
			{currRoute[0] === 'omnichannel-managers' && <AddManager reload={reload} pi='x24'/>}
			<Page.Content>
				<GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data && data.users} total={data && data.total} setParams={setParams} params={params} />
			</Page.Content>
		</Page>
		{children}
	</Page>;
}

export default ManageAgents;
