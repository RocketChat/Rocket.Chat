

import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';
import { Table, Icon, Button } from '@rocket.chat/fuselage';

import { Th } from '../../../../client/components/GenericTable';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../../client/components/NotAuthorizedPage';
import { useRouteParameter, useRoute } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import PrioritiesPage from './PrioritiesPage';
import { PriorityEditWithData, PriorityNew } from './EditPriority';
import DeleteWarningModal from '../../../../client/components/DeleteWarningModal';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';

export function RemovePriorityButton({ _id, reload }) {
	const removePriority = useMethod('livechat:removePriority');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();


	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removePriority(_id);
		} catch (error) {
			console.log(error);
		}
		reload();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Priority_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(<DeleteWarningModal onDelete={onDeleteAgent} onCancel={() => setModal()}/>);
	});

	return <Table.Cell fontScale='p1' color='hint' withTruncatedText>
		<Button small ghost title={t('Remove')} onClick={handleDelete}>
			<Icon name='trash' size='x16'/>
		</Button>
	</Table.Cell>;
}

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	fields: JSON.stringify({ name: 1 }),
	text,
	sort: JSON.stringify({ [column]: sortDir(direction), usernames: column === 'name' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, itemsPerPage, current, column, direction]);

function PrioritiesRoute() {
	const t = useTranslation();
	const canViewPriorities = usePermission('manage-livechat-priorities');

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const prioritiesRoute = useRoute('omnichannel-priorities');
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

	const onRowClick = useMutableCallback((id) => () => prioritiesRoute.push({
		context: 'edit',
		id,
	}));

	const { data, reload } = useEndpointDataExperimental('livechat/priorities.list', query) || {};

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x120'>{t('Name')}</Th>,
		<Th key={'description'} direction={sort[1]} active={sort[0] === 'description'} onClick={onHeaderClick} sort='description' w='x200'>{t('Description')}</Th>,
		<Th key={'dueTimeInMinutes'} direction={sort[1]} active={sort[0] === 'dueTimeInMinutes'} onClick={onHeaderClick} sort='dueTimeInMinutes' w='x120'>{t('Estimated_due_time')}</Th>,
		<Th key={'remove'} w='x40'>{t('Remove')}</Th>,
	].filter(Boolean), [sort, onHeaderClick, t]);

	const renderRow = useCallback(({ _id, name, description, dueTimeInMinutes }) => <Table.Row key={_id} tabIndex={0} role='link' onClick={onRowClick(_id)} action qa-user-id={_id}>
		<Table.Cell withTruncatedText>{name}</Table.Cell>
		<Table.Cell withTruncatedText>{description}</Table.Cell>
		<Table.Cell withTruncatedText>{dueTimeInMinutes}  {t('minutes')}</Table.Cell>
		<RemovePriorityButton _id={_id} reload={reload}/>
	</Table.Row>, [reload, onRowClick, t]);


	const EditPrioritiesTab = useCallback(() => {
		if (!context) {
			return '';
		}
		const handleVerticalBarCloseButtonClick = () => {
			prioritiesRoute.push({});
		};

		return <VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				{context === 'edit' && t('Edit_Priority')}
				{context === 'new' && t('New_Priority')}
				<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
			</VerticalBar.Header>

			{context === 'edit' && <PriorityEditWithData priorityId={id} reload={reload}/>}
			{context === 'new' && <PriorityNew reload={reload} />}

		</VerticalBar>;
	}, [t, context, id, prioritiesRoute, reload]);

	if (!canViewPriorities) {
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
