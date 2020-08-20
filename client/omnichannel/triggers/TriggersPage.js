import React, { useRef } from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import TriggersTable from './TriggersTable';
import EditTriggerPage from './EditTriggerPage';
import NewTriggerPage from './NewTriggerPage';
import VerticalBar from '../../components/basic/VerticalBar';
import Page from '../../components/basic/Page';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { usePermission } from '../../contexts/AuthorizationContext';

const MonitorsPage = () => {
	const t = useTranslation();

	const canViewTriggers = usePermission('view-livechat-triggers');

	const router = useRoute('omnichannel-triggers');

	const reload = useRef(() => {});

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleAdd = useMutableCallback(() => {
		router.push({ context: 'new' });
	});

	const handleCloseVerticalBar = useMutableCallback(() => {
		router.push({});
	});

	if (!canViewTriggers) {
		return <NotAuthorizedPage />;
	}

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Livechat_Triggers')} >
				<Button small onClick={handleAdd}>
					<Icon name='plus' size='x16' />
				</Button>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<TriggersTable reloadRef={reload}/>
			</Page.ScrollableContentWithShadow>
		</Page>
		{context && <VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				{t('Trigger')}
				<VerticalBar.Close onClick={handleCloseVerticalBar} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				{context === 'edit' && <EditTriggerPage id={id} onSave={reload.current}/>}
				{context === 'new' && <NewTriggerPage onSave={reload.current}/>}
			</VerticalBar.ScrollableContent>
		</VerticalBar>}
	</Page>;
};

export default MonitorsPage;
