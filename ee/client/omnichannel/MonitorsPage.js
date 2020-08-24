import React, { useState, useMemo } from 'react';
import { Button, Box, Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import MonitorsTable from './MonitorsTable';
import Page from '../../../client/components/basic/Page';
import NotAuthorizedPage from '../../../client/components/NotAuthorizedPage';
import PageSkeleton from '../../../client/components/PageSkeleton';
import { useHasLicense } from '../hooks/useHasLicense';
import { useTranslation } from '../../../client/contexts/TranslationContext';
import { useToastMessageDispatch } from '../../../client/contexts/ToastMessagesContext';
import { useMethod } from '../../../client/contexts/ServerContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../client/hooks/useEndpointDataExperimental';
import { UserAutoComplete } from '../../../client/components/basic/AutoComplete';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	text,
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, itemsPerPage, current, column, direction]);

const MonitorsPageContainer = () => {
	const license = useHasLicense('livechat-enterprise');

	if (license === 'loading') {
		return <PageSkeleton />;
	}

	if (!license) {
		return <NotAuthorizedPage />;
	}

	return <MonitorsPage />;
};

const MonitorsPage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [params, setParams] = useState(() => ({ current: 0, itemsPerPage: 25, text: '' }));
	const [sort, setSort] = useState(['name', 'asc']);
	const [username, setUsername] = useState('');

	const { data, state, reload } = useEndpointDataExperimental('livechat/monitors.list', useQuery(params, sort));

	const addMonitor = useMethod('livechat:addMonitor');

	const onHeaderClick = useMutableCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	});

	const handleAdd = useMutableCallback(async () => {
		try {
			await addMonitor(username);
			reload();
			setUsername('');
			dispatchToastMessage({ type: 'success', message: t('Monitor_added') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	if (state === ENDPOINT_STATES.ERROR) {
		return <Callout>
			{t('Error')}
		</Callout>;
	}

	return <Page>
		<Page.Header title={t('Livechat_Monitors')} />
		<Page.ScrollableContentWithShadow>
			<Box display='flex' flexDirection='1'>
				<UserAutoComplete value={username} onChange={setUsername}/>
				<Button primary onClick={handleAdd} mis='x8'>{t('Add')}</Button>
			</Box>
			<MonitorsTable
				monitors={data?.monitors}
				totalMonitors={data?.total}
				params={params}
				onChangeParams={setParams}
				onHeaderClick={onHeaderClick}
				sort={sort}
				onDelete={reload}
			/>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default MonitorsPageContainer;
