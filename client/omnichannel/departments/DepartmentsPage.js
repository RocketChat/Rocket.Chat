import React, { useState, useEffect } from 'react';
import { TextInput, Button, Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { GenericTable } from '../../components/GenericTable';
import { useRoute } from '../../contexts/RouterContext';


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

function DepartmentsPage({
	data,
	header,
	setParams,
	params,
	title,
	renderRow,
	children,
}) {
	const departmentsRoute = useRoute('omnichannel-departments');

	const onAddNew = useMutableCallback(() => departmentsRoute.push({
		context: 'new',
	}));
	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={title}>
				<Button small onClick={onAddNew}>
					<Icon name='plus' size='x16'/>
				</Button>
			</Page.Header>
			<Page.Content>
				<GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data && data.departments} total={data && data.total} setParams={setParams} params={params} />
			</Page.Content>
		</Page>
		{children}
	</Page>;
}

export default DepartmentsPage;
