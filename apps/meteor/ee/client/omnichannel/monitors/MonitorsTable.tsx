import {
	IconButton,
	Pagination,
	Button,
	Field,
	Box,
	States,
	StatesIcon,
	StatesTitle,
	StatesActions,
	StatesAction,
} from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useToastMessageDispatch, useMethod, useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, hashQueryKey } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import FilterByText from '../../../../client/components/FilterByText';
import GenericModal from '../../../../client/components/GenericModal';
import GenericNoResults from '../../../../client/components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
} from '../../../../client/components/GenericTable';
import { usePagination } from '../../../../client/components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../client/components/GenericTable/hooks/useSort';
import UserAutoComplete from '../../../../client/components/UserAutoComplete';
import { queryClient } from '../../../../client/lib/queryClient';

const MonitorsTable = () => {
	const t = useTranslation();
	const setModal = useSetModal();

	const [text, setText] = useState('');
	const [username, setUsername] = useState('');
	const debouncedText = useDebouncedValue(text, 500);

	const dispatchToastMessage = useToastMessageDispatch();

	const pagination = usePagination();
	const sort = useSort<'name' | 'username' | 'email'>('name');

	const getMonitors = useEndpoint('GET', '/v1/livechat/monitors');

	// TODO: implement endpoints for monitors add/remove
	const removeMonitor = useMethod('livechat:removeMonitor');
	const addMonitor = useMethod('livechat:addMonitor');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = pagination;
	const { sortBy, sortDirection, setSort } = sort;

	const query = useMemo(
		() => ({
			text: debouncedText,
			sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[debouncedText, itemsPerPage, current, sortBy, sortDirection],
	);

	const { data, refetch, isLoading, isSuccess, isError } = useQuery(['omnichannel', 'monitors', debouncedText, pagination, sort], () =>
		getMonitors(query),
	);

	const [defaultQuery] = useState(hashQueryKey([query]));
	const queryHasChanged = defaultQuery !== hashQueryKey([query]);

	const addMutation = useMutation({
		mutationFn: async (username: string) => {
			await addMonitor(username);

			await queryClient.invalidateQueries(['omnichannel', 'monitors']);
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
			queryClient.invalidateQueries(['omnichannel', 'monitors']);
			setModal();
		};

		setModal(<GenericModal variant='danger' onConfirm={onDeleteMonitor} onCancel={() => setModal()} confirmText={t('Delete')} />);
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
					<Field.Label>{t('Username')}</Field.Label>
					<Field.Row>
						<UserAutoComplete value={username} onChange={setUsername as () => void} />
						<Button primary disabled={!username || addMutation.isLoading} onClick={() => handleAdd()} mis={8}>
							{t('Add_monitor')}
						</Button>
					</Field.Row>
				</Field>
			</Box>
			{((isSuccess && data?.monitors.length > 0) || queryHasChanged) && <FilterByText onChange={({ text }): void => setText(text)} />}
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
					linkHref='https://go.rocket.chat/omnichannel-docs'
					linkText={t('Learn_more_about_monitors')}
				/>
			)}
			{isSuccess && data.monitors.length > 0 && (
				<>
					<GenericTable aria-busy={text !== debouncedText} aria-live='assertive'>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.monitors?.map((monitor) => (
								<GenericTableRow key={monitor._id} tabIndex={0} width='full'>
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
