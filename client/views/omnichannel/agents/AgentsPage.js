import React, { useState } from 'react';
import { Button, Box, Field } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { UserAutoComplete } from '../../../components/AutoComplete';
import Page from '../../../components/Page';
import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';

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
		<Field>
			<Field.Label>{t('Username')}</Field.Label>
			<Field.Row>
				<UserAutoComplete value={username} onChange={setUsername}/>
				<Button disabled={!username} onClick={handleSave} mis='x8' primary>{t('Add')}</Button>
			</Field.Row>
		</Field>
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
				<GenericTable
					header={header}
					renderRow={renderRow}
					results={data && data.users}
					total={data && data.total}
					setParams={setParams}
					params={params}
					renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
				/>
			</Page.Content>
		</Page>
		{children}
	</Page>;
}

export default AgentsPage;
