import { Button, Box, Callout, Field } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useTranslation, useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

import FilterByText from '../../../../client/components/FilterByText';
import GenericModal from '../../../../client/components/GenericModal';
import GenericNoResults from '../../../../client/components/GenericNoResults';
import { usePagination } from '../../../../client/components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../client/components/GenericTable/hooks/useSort';
import Page from '../../../../client/components/Page';
import UserAutoComplete from '../../../../client/components/UserAutoComplete';
import { queryClient } from '../../../../client/lib/queryClient';
import MonitorsTable from './MonitorsTable';

const MonitorsPage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [text, setText] = useState('');
	const pagination = usePagination();
	const sort = useSort<'name' | 'username' | 'email'>('name');

	const [username, setUsername] = useState('');

	const debouncedText = useDebouncedValue(text, 500);

	const getMonitors = useEndpoint('GET', '/v1/livechat/monitors');

	const setModal = useSetModal();

	// TODO: implement endpoints for monitors add/remove
	const removeMonitor = useMethod('livechat:removeMonitor');
	const addMonitor = useMethod('livechat:addMonitor');

	const handleAdd = async () => {
		try {
			await addMonitor(username);
			setUsername('');
			dispatchToastMessage({ type: 'success', message: t('Monitor_added') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
		queryClient.invalidateQueries(['omnichannel', 'monitors']);
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

	const {
		data,
		isInitialLoading: isLoadingMonitors,
		isError: isErrorMonitors,
	} = useQuery(['omnichannel', 'monitors', debouncedText, pagination, sort], () =>
		getMonitors({
			text,
			sort: JSON.stringify({ [sort.sortBy]: sort.sortDirection === 'asc' ? 1 : -1 }),
			...(pagination.current && { offset: pagination.current }),
			...(pagination.itemsPerPage && { count: pagination.itemsPerPage }),
		}),
	);

	if (isErrorMonitors) {
		return <Callout>{t('Error')}</Callout>;
	}

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Livechat_Monitors')} />
				<Page.Content>
					<Box display='flex' flexDirection='column'>
						<Field>
							<Field.Label>{t('Username')}</Field.Label>
							<Field.Row>
								<UserAutoComplete value={username} onChange={setUsername as () => void} />
								<Button primary disabled={!username} onClick={() => handleAdd()} mis='x8'>
									{t('Add')}
								</Button>
							</Field.Row>
						</Field>
					</Box>

					<FilterByText onChange={({ text }): void => setText(text)} />
					{!data || data.total < 1 ? (
						<GenericNoResults
							icon='baloon-exclamation'
							title={t('No_monitors_found')}
							description={t('No_monitors_found-description')}
						></GenericNoResults>
					) : (
						<MonitorsTable
							aria-busy={text !== debouncedText}
							aria-live='assertive'
							pagination={pagination}
							data={data}
							loading={isLoadingMonitors}
							sort={sort}
							handleRemove={handleRemove}
						/>
					)}
				</Page.Content>
			</Page>
		</Page>
	);
};

export default MonitorsPage;
