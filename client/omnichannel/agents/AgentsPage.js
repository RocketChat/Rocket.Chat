import React, { useState, useEffect } from 'react';
import { TextInput, Button, Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import { GenericTable } from '../../components/GenericTable';
import { UserAutoComplete } from '../../components/basic/AutoComplete';

const FilterByText = ({ setFilter, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');

	const handleChange = useMutableCallback((event) => setText(event.currentTarget.value));
	const onSubmit = useMutableCallback((e) => e.preventDefault());

	useEffect(() => {
		setFilter({ text });
	}, [setFilter, text]);
	return <Box mb='x16' is='form' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
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

function AgentsPage({
	data,
	reload,
	header,
	setParams,
	params,
	title,
	renderRow,
	children,
}) {
	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={title}/>
			<AddAgent reload={reload} pi='x24'/>
			<Page.Content>
				<GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data && data.users} total={data && data.total} setParams={setParams} params={params} />
			</Page.Content>
		</Page>
		{children}
	</Page>;
}

export default AgentsPage;
