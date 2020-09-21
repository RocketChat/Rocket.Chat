

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
import UnitsPage from './UnitsPage';
import { UnitEditWithData, UnitNew } from './EditUnit';
import DeleteWarningModal from '../../../../client/components/DeleteWarningModal';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';


export function RemoveUnitButton({ _id, reload }) {
	const removeUnit = useMethod('livechat:removeUnit');
	const unitsRoute = useRoute('omnichannel-units');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removeUnit(_id);
		} catch (error) {
			console.log(error);
		}
		unitsRoute.push({});
		reload();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Unit_removed') });
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

function UnitsRoute() {
	const t = useTranslation();
	const canViewUnits = usePermission('manage-livechat-units');

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const unitsRoute = useRoute('omnichannel-units');
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

	const onRowClick = useMutableCallback((id) => () => unitsRoute.push({
		context: 'edit',
		id,
	}));

	const { data, reload } = useEndpointDataExperimental('livechat/units.list', query) || {};

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x120'>{t('Name')}</Th>,
		<Th key={'visibility'} direction={sort[1]} active={sort[0] === 'visibility'} onClick={onHeaderClick} sort='visibility' w='x200'>{t('Visibility')}</Th>,
		<Th key={'remove'} w='x40'>{t('Remove')}</Th>,
	].filter(Boolean), [sort, onHeaderClick, t]);

	const renderRow = useCallback(({ _id, name, visibility }) => <Table.Row key={_id} tabIndex={0} role='link' onClick={onRowClick(_id)} action qa-user-id={_id}>
		<Table.Cell withTruncatedText>{name}</Table.Cell>
		<Table.Cell withTruncatedText>{visibility}</Table.Cell>
		<RemoveUnitButton _id={_id} reload={reload}/>
	</Table.Row>, [reload, onRowClick]);


	const EditUnitsTab = useCallback(() => {
		if (!context) {
			return '';
		}
		const handleVerticalBarCloseButtonClick = () => {
			unitsRoute.push({});
		};

		return <VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				{context === 'edit' && t('Edit_Unit')}
				{context === 'new' && t('New_Unit')}
				<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
			</VerticalBar.Header>

			{context === 'edit' && <UnitEditWithData unitId={id} reload={reload}/>}
			{context === 'new' && <UnitNew reload={reload} />}

		</VerticalBar>;
	}, [t, context, id, unitsRoute, reload]);

	if (!canViewUnits) {
		return <NotAuthorizedPage />;
	}


	return <UnitsPage
		setParams={setParams}
		params={params}
		onHeaderClick={onHeaderClick}
		data={data} useQuery={useQuery}
		reload={reload}
		header={header}
		renderRow={renderRow}
		title={'Units'}>
		<EditUnitsTab />
	</UnitsPage>;
}

export default UnitsRoute;
