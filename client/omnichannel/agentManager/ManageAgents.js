import React, { useCallback, useState, useEffect } from 'react';
import { TextInput, Button, Box, Icon } from '@rocket.chat/fuselage';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import { GenericTable } from '../../components/GenericTable';


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


function AgentsManagerAdd({ reload, endpoint }) {
	const t = useTranslation();
	const [username, setUsername] = useState('');
	const handleChange = useCallback((event) => setUsername(event.currentTarget.value), []);


	const saveAction = useEndpointAction('POST', endpoint, { username });

	const handleSave = useCallback(async () => {
		if (username) {
			const result = await saveAction();
			if (result.success === true) {
				reload();
				setUsername('');
			}
		}
	}, [username, saveAction, reload]);
	return <Box display='flex' alignItems='center'>
		<TextInput value={username} onSubmit={handleSave} onChange={handleChange} maxWidth={400} /><Button onClick={handleSave} marginInlineStart={4} primary margin>{t('Add')}</Button>
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
	endpoint,
	children,
}) {
	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={title}>
			</Page.Header>
			<Page.Content>
				<AgentsManagerAdd reload={reload} endpoint={endpoint}/>
				<GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data && data.users} total={data && data.total} setParams={setParams} params={params} />
			</Page.Content>
		</Page>
		{children}
	</Page>;
}

export default ManageAgents;
