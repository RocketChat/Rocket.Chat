

import { useDebouncedValue, useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';
import { Box, Table, Icon } from '@rocket.chat/fuselage';

import { Th } from '../../../../client/components/GenericTable';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../../client/components/NotAuthorizedPage';
import { useRouteParameter, useRoute } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import PrioritiesPage from './PrioritiesPage';

export function RemovePriorityButton({ _id, reload }) {
	const deleteAction = useMethod('livechat:removePriority');

	const handleRemoveClick = useMutableCallback(async (e) => {
		e.preventDefault();
		let result;
		try {
			result = await deleteAction(_id);
		} catch (error) {
			console.log(error);
		}
		console.log(result);
		reload();
	});

	return <Table.Cell fontScale='p1' color='hint' onClick={handleRemoveClick} withTruncatedText><Icon name='trash' size='x20'/></Table.Cell>;
}

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, username: 1, emails: 1, avatarETag: 1 }),
	text,
	sort: JSON.stringify({ [column]: sortDir(direction), usernames: column === 'name' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, itemsPerPage, current, column, direction]);

function PrioritiesRoute() {
	const t = useTranslation();
	const canViewAgents = usePermission('manage-livechat-agents');

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const agentsRoute = useRoute('omnichannel-agents');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const onHeaderClick = useMutableCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	});

	const onRowClick = useMutableCallback((id) => () => agentsRoute.push({
		context: 'info',
		id,
	}));

    const { data, reload } = useEndpointDataExperimental('livechat/priorities.list', query) || {};
    
    console.log(data);


	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>{t('Name')}</Th>,
		<Th key={'description'} direction={sort[1]} active={sort[0] === 'description'} onClick={onHeaderClick} sort='description' w='x120'>{t('Description')}</Th>,
		<Th key={'remove'} w='x40'>{t('Remove')}</Th>,
	].filter(Boolean), [sort, onHeaderClick, t, mediaQuery]);

	const renderRow = useCallback(({ _id, name, description }) => <Table.Row key={_id} tabIndex={0} role='link' onClick={onRowClick(_id)} action qa-user-id={_id}>
		<Table.Cell withTruncatedText>{name}</Table.Cell>
		<Table.Cell withTruncatedText>{description}</Table.Cell>
		<RemovePriorityButton _id={_id} reload={reload}/>
	</Table.Row>, [reload, onRowClick]);


	const EditPrioritiesTab = useCallback(() => {
		if (!context) {
			return '';
		}
		const handleVerticalBarCloseButtonClick = () => {
			agentsRoute.push({});
		};

		return <VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				{context === 'edit' && t('Edit_User')}
				{context === 'info' && t('User_Info')}
				<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
			</VerticalBar.Header>

			{/* {context === 'edit' && <PriorityEdit uid={id} reload={reload}/>}
			{context === 'new' && <PriorityNew uid={id} />} */}

		</VerticalBar>;
	}, [t, context, id, agentsRoute, reload]);

	if (!canViewAgents) {
		return <NotAuthorizedPage />;
	}


	return <PrioritiesPage
		setParams={setParams}
		params={params}
		onHeaderClick={onHeaderClick}
		data={data} useQuery={useQuery}
		reload={reload}
		header={header}
		renderRow={renderRow}
		title={'Priorities'}>
		<EditPrioritiesTab />
	</PrioritiesPage>;
}

export default PrioritiesRoute;
