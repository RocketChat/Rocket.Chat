

import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';
import { Table, Icon, Button } from '@rocket.chat/fuselage';

import GenericTable from '../../../../client/components/GenericTable';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../../client/components/NotAuthorizedPage';
import { useRouteParameter, useRoute } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/VerticalBar';
import TagsPage from './TagsPage';
import { TagEditWithData, TagNew } from './EditTag';
import DeleteWarningModal from '../../../../client/components/DeleteWarningModal';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';

export function RemoveTagButton({ _id, reload }) {
	const removeTag = useMethod('livechat:removeTag');
	const tagsRoute = useRoute('omnichannel-tags');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removeTag(_id);
		} catch (error) {
			console.log(error);
		}
		tagsRoute.push({});
		reload();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Tag_removed') });
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

function TagsRoute() {
	const t = useTranslation();
	const canViewTags = usePermission('manage-livechat-tags');

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const tagsRoute = useRoute('omnichannel-tags');
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

	const onRowClick = useMutableCallback((id) => () => tagsRoute.push({
		context: 'edit',
		id,
	}));

	const { value: data = {}, reload } = useEndpointData('livechat/tags.list', query);

	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'description'} direction={sort[1]} active={sort[0] === 'description'} onClick={onHeaderClick} sort='description'>{t('Description')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'remove'} w='x60'>{t('Remove')}</GenericTable.HeaderCell>,
	].filter(Boolean), [sort, onHeaderClick, t]);

	const renderRow = useCallback(({ _id, name, description }) => <Table.Row key={_id} tabIndex={0} role='link' onClick={onRowClick(_id)} action qa-user-id={_id}>
		<Table.Cell withTruncatedText>{name}</Table.Cell>
		<Table.Cell withTruncatedText>{description}</Table.Cell>
		<RemoveTagButton _id={_id} reload={reload}/>
	</Table.Row>, [reload, onRowClick]);


	const EditTagsTab = useCallback(() => {
		if (!context) {
			return '';
		}
		const handleVerticalBarCloseButtonClick = () => {
			tagsRoute.push({});
		};

		return <VerticalBar>
			<VerticalBar.Header>
				{context === 'edit' && t('Edit_Tag')}
				{context === 'new' && t('New_Tag')}
				<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
			</VerticalBar.Header>

			{context === 'edit' && <TagEditWithData tagId={id} reload={reload}/>}
			{context === 'new' && <TagNew reload={reload} />}

		</VerticalBar>;
	}, [t, context, id, tagsRoute, reload]);

	if (!canViewTags) {
		return <NotAuthorizedPage />;
	}


	return <TagsPage
		setParams={setParams}
		params={params}
		onHeaderClick={onHeaderClick}
		data={data} useQuery={useQuery}
		reload={reload}
		header={header}
		renderRow={renderRow}
		title={'Tags'}>
		<EditTagsTab />
	</TagsPage>;
}

export default TagsRoute;
