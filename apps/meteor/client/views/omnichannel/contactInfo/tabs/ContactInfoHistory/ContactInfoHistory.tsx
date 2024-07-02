import {
	Box,
	Margins,
	TextInput,
	Icon,
	Throbber,
	States,
	StatesIcon,
	StatesTitle,
	StatesSubtitle,
	Select,
	Callout,
} from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import React, { useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { ContextualbarContent, ContextualbarEmptyContent } from '../../../../../components/Contextualbar';
import { VirtuosoScrollbars } from '../../../../../components/CustomScrollbars';
import { useRecordList } from '../../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import { useOmnichannelRoom } from '../../../../room/contexts/RoomContext';
import { useHistoryList } from '../../hooks/useHistoryList';
import ContactHistoryItem from './ContactHistoryItem';

const ContactInfoHistory = () => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const room = useOmnichannelRoom();

	const { itemsList: historyList, loadMoreItems } = useHistoryList(
		useMemo(() => ({ roomId: room._id, filter: text, visitorId: room.v._id }), [room, text]),
	);

	const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
		setText(event.currentTarget.value);
	};

	const { phase, error, items: history, itemCount: totalItemCount } = useRecordList(historyList);

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
						<TextInput placeholder={t('Search')} value={text} onChange={handleSearchChange} addon={<Icon name='magnifier' size='x20' />} />
						<Box width='50%'>
							<Select width='100%' options={[['whatsapp', 'Whatsapp']]} />
						</Box>
					</Margins>
				</Box>
			</Box>
			<Box p={24}>
				<Callout>Only conversations you are contact manager of appear here.</Callout>
			</Box>
			{phase === AsyncStatePhase.LOADING && (
				<Box pi={24} pb={12}>
					<Throbber size='x12' />
				</Box>
			)}
			{error && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesSubtitle>{error.toString()}</StatesSubtitle>
				</States>
			)}
			{phase !== AsyncStatePhase.LOADING && totalItemCount === 0 && <ContextualbarEmptyContent title={t('No_results_found')} />}
			<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
				{!error && totalItemCount > 0 && history.length > 0 && (
					<Virtuoso
						totalCount={totalItemCount}
						endReached={
							phase === AsyncStatePhase.LOADING ? () => undefined : (start) => loadMoreItems(start, Math.min(50, totalItemCount - start))
						}
						overscan={25}
						data={history}
						components={{ Scroller: VirtuosoScrollbars }}
						itemContent={(index, data) => <ContactHistoryItem key={index} history={data} />}
					/>
				)}
			</Box>
		</ContextualbarContent>
	);
};

export default ContactInfoHistory;
