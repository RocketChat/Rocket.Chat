import { Box, Margins, Throbber, States, StatesIcon, StatesTitle, Select } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import { ContextualbarContent, ContextualbarEmptyContent } from '../../../../../components/Contextualbar';
import { VirtuosoScrollbars } from '../../../../../components/CustomScrollbars';
// import { useRecordList } from '../../../../../hooks/lists/useRecordList';
// import { AsyncStatePhase } from '../../../../../lib/asyncState';
// import { useOmnichannelRoom } from '../../../../room/contexts/RoomContext';
// import { useHistoryList } from '../../../contactHistory/useHistoryList';
import ContactInfoHistoryItem from '../../components/ContactInfoHistoryItem';

const ContactInfoHistory = ({ contactId, setChatId }) => {
	const t = useTranslation();

	// const [text, setText] = useState('');
	// const room = useOmnichannelRoom();

	// const { itemsList: historyList, loadMoreItems } = useHistoryList(
	// 	useMemo(() => ({ roomId: room._id, filter: text, visitorId: room.v._id }), [room, text]),
	// );

	const historyFilterOptions: [string, string][] = [
		['all', t('All')],
		['widget', t('Livechat')],
		['email', t('Email')],
		['sms', t('SMS')],
		['app', t('Apps')],
		['api', t('API')],
		['other', t('Other')],
	];

	// const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
	// 	setText(event.currentTarget.value);
	// };

	const [type, setType] = useLocalStorage<string>('contact-history-type', 'all');

	const getContactHistory = useEndpoint('GET', '/v1/omnichannel/contacts.history');
	const { data, isLoading, isError } = useQuery(['getContactHistory', contactId, type], () =>
		getContactHistory({ contactId, source: type === 'all' ? undefined : type }),
	);

	console.log(data);

	// const { phase, error, items: history, itemCount: totalItemCount } = useRecordList(historyList);

	return (
		<ContextualbarContent paddingInline={0}>
			<Box
				display='flex'
				flexDirection='row'
				p={24}
				borderBlockEndWidth='default'
				borderBlockEndStyle='solid'
				borderBlockEndColor='extra-light'
				flexShrink={0}
			>
				<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
					<Margins inline={4}>
						<Select value={type} onChange={(value) => setType(value as string)} placeholder={t('Filter')} options={historyFilterOptions} />
					</Margins>
				</Box>
			</Box>
			{/* <Box p={24}>
				<Callout>Only conversations you are contact manager of appear here.</Callout>
			</Box> */}
			{isLoading && (
				<Box pi={24} pb={12}>
					<Throbber size='x12' />
				</Box>
			)}
			{isError && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					{/* <StatesSubtitle>{error.toString()}</StatesSubtitle> */}
				</States>
			)}
			{data?.history.length === 0 && (
				<ContextualbarEmptyContent icon='history' title={t('No_history_yet')} subtitle={t('No_history_yet_description')} />
			)}
			<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
				{!isError && data?.history && data.history.length > 0 && (
					<Virtuoso
						totalCount={data.history.length}
						// endReached={
						// 	phase === AsyncStatePhase.LOADING ? () => undefined : (start) => loadMoreItems(start, Math.min(50, totalItemCount - start))
						// }
						overscan={25}
						data={data?.history}
						components={{ Scroller: VirtuosoScrollbars }}
						itemContent={(index, data) => (
							<ContactInfoHistoryItem key={index} details={data.source} onClick={() => setChatId(data._id)} {...data} />
						)}
					/>
				)}
			</Box>
		</ContextualbarContent>
	);
};

export default ContactInfoHistory;
