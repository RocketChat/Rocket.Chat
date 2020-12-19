import React, { useEffect, useMemo } from 'react';
import { TextInput, Box, Icon, MultiSelect, Select, InputBox, Menu } from '@rocket.chat/fuselage';
import { useMutableCallback, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';
import { useSubscription } from 'use-subscription';

import { formsSubscription } from '../additionalForms';
import Page from '../../../components/Page';
import { useTranslation } from '../../../contexts/TranslationContext';
import { usePermission } from '../../../contexts/AuthorizationContext';
import GenericTable from '../../../components/GenericTable';
import { useMethod } from '../../../contexts/ServerContext';
import DeleteWarningModal from '../../../components/DeleteWarningModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { AutoCompleteDepartment } from '../../../components/AutoCompleteDepartment';
import { AutoCompleteAgent } from '../../../components/AutoCompleteAgent';
import { useEndpointData } from '../../../hooks/useEndpointData';

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
					<Icon name='trash' size='x16' marginInlineEnd='x4' />{t('Delete_all_closed_chats')}
				</Box>,
				action: handleRemoveClosed,
			},
		},
	};
	return <Menu alignSelf='flex-end' small={false} square options={menuOptions} placement='bottom-start' {...props}/>;
};


const FilterByText = ({ setFilter, reload, ...props }) => {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const { value: allCustomFields } = useEndpointData('livechat/custom-fields');
	const statusOptions = [['all', t('All')], ['closed', t('Closed')], ['opened', t('Open')]];
	const customFieldsOptions = useMemo(() => (allCustomFields && allCustomFields.customFields ? allCustomFields.customFields.map(({ _id, label }) => [_id, label]) : []), [allCustomFields]);

	const [guest, setGuest] = useLocalStorage('guest', '');
	const [servedBy, setServedBy] = useLocalStorage('servedBy', 'all');
	const [status, setStatus] = useLocalStorage('status', 'all');
	const [department, setDepartment] = useLocalStorage('department', 'all');
	const [from, setFrom] = useLocalStorage('from', '');
	const [to, setTo] = useLocalStorage('to', '');
	const [tags, setTags] = useLocalStorage('tags', []);
	const [customFields, setCustomFields] = useLocalStorage('tags', []);

	const handleGuest = useMutableCallback((e) => setGuest(e.target.value));
	const handleServedBy = useMutableCallback((e) => setServedBy(e));
	const handleStatus = useMutableCallback((e) => setStatus(e));
	const handleDepartment = useMutableCallback((e) => setDepartment(e));
	const handleFrom = useMutableCallback((e) => setFrom(e.target.value));
	const handleTo = useMutableCallback((e) => setTo(e.target.value));
	const handleTags = useMutableCallback((e) => setTags(e));
	const handleCustomFields = useMutableCallback((e) => setCustomFields(e));

	const reset = useMutableCallback(() => {
		setGuest('');
		setServedBy('all');
		setStatus('all');
		setDepartment('all');
		setFrom('');
		setTo('');
		setTags([]);
		setCustomFields([]);
	});

	const forms = useSubscription(formsSubscription);

	const {
		useCurrentChatTags = () => {},
	} = forms;

	const Tags = useCurrentChatTags();

	const onSubmit = useMutableCallback((e) => e.preventDefault());
	const reducer = function(acc, curr) {
		acc[curr] = '';
		return acc;
	};

	useEffect(() => {
		setFilter({
			guest,
			servedBy,
			status,
			department,
			from: from && moment(new Date(from)).utc().format('YYYY-MM-DDTHH:mm:ss'),
			to: to && moment(new Date(to)).utc().format('YYYY-MM-DDTHH:mm:ss'),
			tags,
			customFields: customFields.reduce(reducer, {}),
		});
	}, [setFilter, guest, servedBy, status, department, from, to, tags, customFields]);

	const handleClearFilters = useMutableCallback(() => {
		reset();
	});

	const removeClosedChats = useMethod('livechat:removeAllClosedRooms');

	const handleRemoveClosed = useMutableCallback(async () => {
		const onDeleteAll = async () => {
			try {
				await removeClosedChats();
				reload();
				dispatchToastMessage({ type: 'success', message: t('Chat_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(<DeleteWarningModal
			onDelete={onDeleteAll}
			onCancel={() => setModal()}
		/>);
	});


	return <Box mb='x16' is='form' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
		<Box display='flex' flexDirection='row' flexWrap='wrap' {...props}>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Label mb='x4' >{t('Guest')}</Label>
				<TextInput flexShrink={0} placeholder={t('Guest')} onChange={handleGuest} value={guest} />
			</Box>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Label mb='x4'>{t('Served_By')}</Label>
				<AutoCompleteAgent value={servedBy} onChange={handleServedBy}/>
			</Box>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Label mb='x4'>{t('Department')}</Label>
				<AutoCompleteDepartment value={department} onChange={handleDepartment}/>
			</Box>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Label mb='x4'>{t('Status')}</Label>
				<Select flexShrink={0} options={statusOptions} value={status} onChange={handleStatus} placeholder={t('Status')}/>
			</Box>
			<Box display='flex' mie='x8' flexGrow={0} flexDirection='column'>
				<Label mb='x4'>{t('From')}</Label>
				<InputBox type='date' flexShrink={0} placeholder={t('From')} onChange={handleFrom} value={from} />
			</Box>
			<Box display='flex' mie='x8' flexGrow={0} flexDirection='column'>
				<Label mb='x4'>{t('To')}</Label>
				<InputBox type='date' flexShrink={0} placeholder={t('To')} onChange={handleTo} value={to} />
			</Box>

			<RemoveAllClosed handleClearFilters={handleClearFilters} handleRemoveClosed={handleRemoveClosed}/>
		</Box>
		{Tags && <Box display='flex' flexDirection='row' marginBlockStart='x8' {...props}>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Label mb='x4'>{t('Tags')}</Label>
				<Tags value={tags} handler={handleTags} />
			</Box>
		</Box>}
		{allCustomFields && <Box display='flex' flexDirection='row' marginBlockStart='x8' {...props}>
			<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
				<Label mb='x4'>{t('Custom_Fields')}</Label>
				<MultiSelect options={customFieldsOptions} value={customFields} onChange={handleCustomFields} flexGrow={1} {...props}/>
			</Box>
		</Box>}
	</Box>;
};


function CurrentChatsPage({
	data,
	header,
	setParams,
	params,
	title,
	renderRow,
	reload,
	children,
}) {
	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={title} />
			<Page.Content>
				<GenericTable
					header={header}
					renderRow={renderRow}
					results={data && data.rooms}
					total={data && data.total}
					setParams={setParams}
					params={params}
					reload={reload}
					renderFilter={({ onChange, ...props }) => <FilterByText setFilter={onChange} {...props} />}
				/>
			</Page.Content>
		</Page>
		{children}
	</Page>;
}

export default CurrentChatsPage;
