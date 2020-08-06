
import React, { useState } from 'react';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import AgentsManagerTable from './AgentsManagerTable';
import AgentsManagerAdd from './AgentsManagerAdd';

function ManageAgents({ type }) {
	const t = useTranslation();

	const [cache, setCache] = useState();

	const title = type === 'agent' ? 'Agents' : 'Managers';

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t(title)}>
			</Page.Header>
			<Page.Content>
				<AgentsManagerAdd setCache={setCache} type={type}/>
				<AgentsManagerTable setCache={setCache} cache={cache} type={type} />
			</Page.Content>
		</Page>
	</Page>;
}

export default ManageAgents;
