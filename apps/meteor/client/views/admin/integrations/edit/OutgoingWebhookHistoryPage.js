import { Button, ButtonGroup, Icon, Pagination } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useRouteParameter, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback, useState, useEffect } from 'react';

import { integrationHistoryStreamer } from '../../../../../app/integrations/client/streamer';
import Page from '../../../../components/Page';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import HistoryContent from './HistoryContent';

function OutgoingWebhookHistoryPage(props) {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const [currentData, setCurrentData] = useState();
	const [current, setCurrent] = useState();
	const [itemsPerPage, setItemsPerPage] = useState();

	const [mounted, setMounted] = useState(false);
	const [total, setTotal] = useState(0);

	const router = useRoute('admin-integrations');

	const clearHistory = useMethod('clearIntegrationHistory');

	const id = useRouteParameter('id');

	const query = useMemo(
		() => ({
			id,
			count: itemsPerPage,
			offset: current,
		}),
		[id, itemsPerPage, current],
	);

	const { value: data, phase: state, reload } = useEndpointData('integrations.history', query);

	const handleClearHistory = async () => {
		try {
			await clearHistory();
			dispatchToastMessage({ type: 'success', message: t('Integration_History_Cleared') });
			reload();
			setMounted(false);
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	};

	const handleClickReturn = () => {
		router.push({});
	};

	const handleDataChange = useMutableCallback(({ type, id, diff, data }) => {
		if (type === 'inserted') {
			setTotal((total) => total + 1);
			setCurrentData((state) => [data].concat(state));
			return;
		}

		if (type === 'updated') {
			setCurrentData((state) => {
				const index = state.findIndex(({ _id }) => _id === id);
				Object.assign(state[index], diff);
				return state;
			});
			return;
		}

		if (type === 'removed') {
			setCurrentData([]);
		}
	});

	useEffect(() => {
		if (state === AsyncStatePhase.RESOLVED && !mounted) {
			setCurrentData(data.history);
			setTotal(data.total);
			setMounted(true);
		}
	}, [data, mounted, state]);

	useEffect(() => {
		if (mounted) {
			integrationHistoryStreamer.on(id, handleDataChange);
		}

		return () => integrationHistoryStreamer.removeListener(id, handleDataChange);
	}, [handleDataChange, id, mounted]);

	const showingResultsLabel = useCallback(
		({ count, current, itemsPerPage }) => t('Showing_results_of', current + 1, Math.min(current + itemsPerPage, count), count),
		[t],
	);

	return (
		<Page flexDirection='column' {...props}>
			<Page.Header title={t('Integration_Outgoing_WebHook_History')}>
				<ButtonGroup>
					<Button onClick={handleClickReturn}>
						<Icon name='back' size='x16' /> {t('Back')}
					</Button>
					<Button primary danger onClick={handleClearHistory} disabled={total === 0}>
						<Icon name='trash' /> {t('clear_history')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<HistoryContent key='historyContent' data={currentData} state={state} />
				<Pagination
					current={current}
					itemsPerPage={itemsPerPage}
					itemsPerPageLabel={t('Items_per_page:')}
					showingResultsLabel={showingResultsLabel}
					count={total}
					onSetItemsPerPage={setItemsPerPage}
					onSetCurrent={setCurrent}
				/>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
}

export default OutgoingWebhookHistoryPage;
