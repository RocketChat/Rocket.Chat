import {
	IconButton,
	Pagination,
	Button,
	Field,
	FieldLabel,
	FieldRow,
	Box,
	States,
	StatesIcon,
	StatesTitle,
	StatesActions,
	StatesAction,
} from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { UserAutoComplete } from '@rocket.chat/ui-client';
import { useTranslation, useToastMessageDispatch, useMethod, useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, hashKey, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import FilterByText from '../../components/FilterByText';
import GenericModal from '../../components/GenericModal';
import GenericNoResults from '../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
} from '../../components/GenericTable';
import { usePagination } from '../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../components/GenericTable/hooks/useSort';

const MonitorsTable = () => {
	const t = useTranslation();
	const setModal = useSetModal();

	const [text, setText] = useState('');
	const [username, setUsername] = useState('');

	const dispatchToastMessage = useToastMessageDispatch();

	const pagination = usePagination();
	const sort = useSort<'name' | 'username' | 'email'>('name');

	const getMonitors = useEndpoint('GET', '/v1/livechat/monitors');

	// TODO: implement endpoints for monitors add/remove
	const removeMonitor = useMethod('livechat:removeMonitor');
	const addMonitor = useMethod('livechat:addMonitor');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = pagination;
	const { sortBy, sortDirection, setSort } = sort;

	const query = useDebouncedValue(
		useMemo(
			() => ({
				text,
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			}),
			[text, itemsPerPage, current, sortBy, sortDirection],
		),
		500,
	);

	const { data, refetch, isLoading, isSuccess, isError } = useQuery({
		queryKey: ['omnichannel', 'monitors', query],
		queryFn: () => getMonitors(query),
	});

	const [defaultQuery] = useState(hashKey([query]));
	const queryHasChanged = defaultQuery !== hashKey([query]);

	const queryClient = useQueryClient();

	const addMutation = useMutation({
		mutationFn: async (username: string) => {
			await addMonitor(username);

			await queryClient.invalidateQueries({ queryKey: ['omnichannel', 'monitors'] });
		},
		onSuccess: () => {
			setUsername('');
			dispatchToastMessage({ type: 'success', message: t('Monitor_added') });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleAdd = () => {
		addMutation.mutate(username);
	};

	const handleRemove = (username: string) => {
		const onDeleteMonitor = async () => {
			try {
				await removeMonitor(username);
				dispatchToastMessage({ type: 'success', message: t('Monitor_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			queryClient.invalidateQueries({ queryKey: ['omnichannel', 'monitors'] });
			setModal();
		};

		setModal(
			<GenericModal
				variant='danger'
				data-qa-id='manage-monitors-confirm-remove'
				onConfirm={onDeleteMonitor}
				onCancel={() => setModal()}
				confirmText={t('Delete')}
			/>,
		);
	};

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort}>
				{t('Name')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='username' direction={sortDirection} active={sortBy === 'username'} onClick={setSort}>
				{t('Username')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='email' direction={sortDirection} active={sortBy === 'email'} onClick={setSort}>
				{t('Email')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='spacer' w={40} />,
		],
		[setSort, sortBy, sortDirection, t],
	);

	return (
		<>
			<Box display='flex' flexDirection='column'>
				<Field>
					<FieldLabel>{t('Username')}</FieldLabel>
					<FieldRow>
						<UserAutoComplete name='monitor' value={username} onChange={setUsername as () => void} />
						<Button primary disabled={!username} loading={addMutation.isPending} onClick={() => handleAdd()} mis={8}>
							{t('Add_monitor')}
						</Button>
					</FieldRow>
				</Field>
			</Box>
			{((isSuccess && data?.monitors.length > 0) || queryHasChanged) && (
				<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
			)}
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={4} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.monitors.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data.monitors.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='shield-blank'
					title={t('No_monitors_yet')}
					description={t('No_monitors_yet_description')}
					linkHref='https://go.rocket.chat/i/omnichannel-docs'
					linkText={t('Learn_more_about_monitors')}
				/>
			)}
			{isSuccess && data.monitors.length > 0 && (
				<>
					<GenericTable aria-busy={isLoading} aria-live='assertive' data-qa-id='manage-monitors-table'>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.monitors?.map((monitor) => (
								<GenericTableRow key={monitor._id} tabIndex={0} width='full' data-qa-id={monitor.name}>
									<GenericTableCell withTruncatedText>{monitor.name}</GenericTableCell>
									<GenericTableCell withTruncatedText>{monitor.username}</GenericTableCell>
									<GenericTableCell withTruncatedText>{monitor.email}</GenericTableCell>
									<GenericTableCell withTruncatedText>
										<IconButton icon='trash' small title={t('Remove')} onClick={() => handleRemove(monitor.username)} />
									</GenericTableCell>
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{isError && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesActions>
						<StatesAction onClick={() => refetch()}>{t('Reload_page')}</StatesAction>
					</StatesActions>
				</States>
			)}
		</>
	);
};

export default MonitorsTable;
