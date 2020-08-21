import React, { useEffect, useMemo } from 'react';
import { TextInput, Box, Icon, MultiSelect, Select, InputBox, Menu } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { usePermission } from '../../contexts/AuthorizationContext';
import { GenericTable } from '../../components/GenericTable';
import { useForm } from '../../hooks/useForm';
import { useMethod } from '../../contexts/ServerContext';


// moment(new Date(from)).utc().format('YYYY-MM-DDTHH:mm:ss')
// guest: '', servedBy: '', status: '', department: '', from: '', to: ''
const Label = (props) => <Box fontScale='p2' color='default' {...props} />;

const RemoveAllClosed = ({ handleClearFilters, handleRemoveClosed, ...props }) => {
	const t = useTranslation();
	const canRemove = usePermission('remove-closed-livechat-rooms');

	const menuOptions = {
		clearFilters: {
			label: <Box>
				<Icon name='refresh' size='x16' marginInlineEnd='x4' />{t('Clear_filters')}
			</Box>,
			action: handleClearFilters,
		},
		...canRemove && {
			removeClosed: {
				label: <Box color='danger'>
					<Icon name='trash' size='x16' marginInlineEnd='x4' />{t('Remove')}
				</Box>,
				action: handleRemoveClosed,
			},
		},
	};
	return <Menu options={menuOptions} {...props}/>;
};


const FilterByText = ({ setFilter, reload, ...props }) => {
	const t = useTranslation();

	const { data: departments } = useEndpointDataExperimental('livechat/department') || {};
	const { data: agents } = useEndpointDataExperimental('livechat/users/agent');

	const depOptions = useMemo(() => (departments && departments.departments ? departments.departments.map(({ _id, name }) => [_id, name || _id]) : []), [departments]);
	const agentOptions = useMemo(() => (agents && agents.users ? agents.users.map(({ _id, username }) => [_id, username || _id]) : []), [agents]);
	const statusOptions = [['all', t('All')], ['closed', t('Closed')], ['opened', t('Open')]];

	const { values, handlers, reset } = useForm({ guest: '', servedBy: [], status: 'all', department: undefined, from: '', to: '' });
	const {
		handleGuest,
		handleServedBy,
		handleStatus,
		handleDepartment,
		handleFrom,
		handleTo,
	} = handlers;
	const {
		guest,
		servedBy,
		status,
		department,
		from,
		to,
	} = values;

	const onSubmit = useMutableCallback((e) => e.preventDefault());

	useEffect(() => {
		setFilter({
			guest,
			servedBy,
			status,
			department,
			from: from && moment(new Date(from)).utc().format('YYYY-MM-DDTHH:mm:ss'),
			to: to && moment(new Date(to)).utc().format('YYYY-MM-DDTHH:mm:ss'),
		});
		console.log(servedBy);
	}, [setFilter, guest, servedBy, status, department, from, to]);

	const handleClearFilters = useMutableCallback(() => {
		reset();
	});

	const removeClosedChats = useMethod('livechat:removeAllClosedRooms');

	const handleRemoveClosed = useMutableCallback(async () => {
		await removeClosedChats();
		console.log(props);
		reload();
	});

	return <Box mb='x16' is='form' onSubmit={onSubmit} display='flex' flexDirection='row' {...props}>
		<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
			<Label mb='x4' >{t('Guest')}:</Label>
			<TextInput flexShrink={0} placeholder={t('Guest')} onChange={handleGuest} value={guest} />
		</Box>
		<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
			<Label mb='x4'>{t('Served_By')}:</Label>
			<MultiSelect flexShrink={0} options={agentOptions} value={servedBy} onChange={handleServedBy} placeholder={t('Served_By')}/>
		</Box>
		<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
			<Label mb='x4'>{t('Department')}:</Label>
			<Select flexShrink={0} options={depOptions} value={department} onChange={handleDepartment} placeholder={t('Department')}/>
		</Box>
		<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
			<Label mb='x4'>{t('Status')}:</Label>
			<Select flexShrink={0} options={statusOptions} value={status} onChange={handleStatus} placeholder={t('Status')}/>
		</Box>
		<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
			<Label mb='x4'>{t('From')}:</Label>
			<InputBox type='date' flexShrink={0} placeholder={t('From')} onChange={handleFrom} value={from} />
		</Box>
		<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
			<Label mb='x4'>{t('To')}:</Label>
			<InputBox type='date' flexShrink={0} placeholder={t('To')} onChange={handleTo} value={to} />
		</Box>
		<RemoveAllClosed handleClearFilters={handleClearFilters} handleRemoveClosed={handleRemoveClosed}/>
	</Box>;
};


function CurrentChatsPage({
	data,
	header,
	setParams,
	params,
	title,
	renderRow,
	departments,
	reload,
	children,
}) {
	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={title} />
			<Page.Content>
				<GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data && data.rooms} departments={departments} total={data && data.total} setParams={setParams} params={params} reload={reload}/>
			</Page.Content>
		</Page>
		{children}
	</Page>;
}

export default CurrentChatsPage;
