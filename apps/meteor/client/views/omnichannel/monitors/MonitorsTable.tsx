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
	Stack,
	type TableColumnWidth,
} from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import {
	UserAutoComplete,
	GenericModal,
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
	getCombineFn,
	usePaginatedQuery,
	usePagination,
	useSort,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useTranslation, useToastMessageDispatch, useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useMutation, hashKey, useQueryClient } from '@tanstack/react-query';
import { useId, useMemo, useState } from 'react';

import FilterByText from '../../../components/FilterByText';
import { links } from '../../../lib/links';

const MonitorsTable = () => {
	const t = useTranslation();
	const setModal = useSetModal();
	const usernameFieldId = useId();

	const [text, setText] = useState('');
	const [username, setUsername] = useState('');

	const dispatchToastMessage = useToastMessageDispatch();

	const sort = useSort<'name' | 'username' | 'email'>('name');

	const getMonitors = useEndpoint('GET', '/v1/livechat/monitors');

	const deleteMonitor = useEndpoint('POST', '/v1/livechat/monitors.delete');
	const addMonitor = useEndpoint('POST', '/v1/livechat/monitors.create');

	const { sortBy, sortDirection, setSort } = sort;

	const query = useDebouncedValue(
		useMemo(
			() => ({
				text,
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
			}),
			[text, sortBy, sortDirection],
		),
		500,
	);

	const queryKey = ['omnichannel', 'monitors', query];
	const {
		current,
		itemsPerPage,
		setItemsPerPage: onSetItemsPerPage,
		setCurrent: onSetCurrent,
		...paginationProps
	} = usePagination({ resetKey: queryKey });

	const { data, refetch, isLoading, isSuccess, isError } = usePaginatedQuery({
		query,
		queryKey,
		queryFn: getMonitors,
		combineData: getCombineFn('monitors'),
		offset: current,
		count: itemsPerPage,
	});

	const [defaultQuery] = useState(hashKey([query, current, itemsPerPage]));
	const queryHasChanged = defaultQuery !== hashKey([query, current, itemsPerPage]);

	const queryClient = useQueryClient();

	const addMutation = useMutation({
		mutationFn: async (username: string) => {
			await addMonitor({ username });

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
				await deleteMonitor({ username });
				dispatchToastMessage({ type: 'success', message: t('Monitor_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			queryClient.invalidateQueries({ queryKey: ['omnichannel', 'monitors'] });
			setModal();
		};

		setModal(<GenericModal variant='danger' onConfirm={onDeleteMonitor} onCancel={() => setModal()} confirmText={t('Delete')} />);
	};

	const columns: TableColumnWidth[] = ['auto', 'auto', 'auto', 40];

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
			<GenericTableHeaderCell key='spacer' />,
		],
		[setSort, sortBy, sortDirection, t],
	);

	return (
		<>
			<Box display='flex' flexDirection='column'>
				<Field>
					<FieldLabel htmlFor={usernameFieldId}>{t('Username')}</FieldLabel>
					<FieldRow>
						<Stack direction='row' align='center' justify='space-between' grow gap={8}>
							<UserAutoComplete id={usernameFieldId} name='monitor' value={username} onChange={setUsername as () => void} />
							<Button variant='primary' disabled={!username} loading={addMutation.isPending} onClick={() => handleAdd()}>
								{t('Add_monitor')}
							</Button>
						</Stack>
					</FieldRow>
				</Field>
			</Box>
			{((isSuccess && data?.monitors.length > 0) || queryHasChanged) && (
				<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
			)}
			{isLoading && (
				<GenericTable columns={columns}>
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
					linkHref={links.go.omnichannelDocs}
					linkText={t('Learn_more_about_monitors')}
				/>
			)}
			{isSuccess && data.monitors.length > 0 && (
				<>
					<GenericTable columns={columns} aria-busy={isLoading} aria-live='polite' aria-label={t('Monitors')}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.monitors?.map((monitor) => (
								<GenericTableRow key={monitor._id} tabIndex={0}>
									<GenericTableCell truncate>{monitor.name}</GenericTableCell>
									<GenericTableCell truncate>{monitor.username}</GenericTableCell>
									<GenericTableCell truncate>{monitor.email}</GenericTableCell>
									<GenericTableCell truncate>
										<IconButton icon='trash' size='small' title={t('Remove')} onClick={() => handleRemove(monitor.username)} />
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
