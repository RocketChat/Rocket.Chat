import { States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent, UIEvent } from 'react';
import React, { useEffect, useRef, useMemo, useState } from 'react';

import { createMessageContext } from '../../../../../../app/ui-utils/client/lib/messageContext';
import { withThrottling } from '../../../../../../lib/utils/highOrderFunctions';
import BlazeTemplate from '../../../components/BlazeTemplate';
import LoadingMessagesIndicator from '../../../components/body/LoadingMessagesIndicator';
import { useRoom } from '../../../contexts/RoomContext';
import { useMessageSearchQuery } from '../hooks/useMessageSearchQuery';

type MessageSearchProps = {
	searchText: string;
};

const MessageSearch = ({ searchText }: MessageSearchProps): ReactElement => {
	const pageSize = useSetting<number>('PageSize') ?? 10;
	const globalSearchEnabled = useSetting<boolean>('GlobalSearchEnabled') ?? false;

	const [payload, setPayload] = useState(() => ({
		limit: pageSize,
		searchAll: false,
	}));
	const messageSearchQuery = useMessageSearchQuery({ searchText, ...payload });

	const hasMore = !!messageSearchQuery.data && !(messageSearchQuery.data?.message?.docs.length < payload.limit);

	const handleToggleGlobalSearch = (event: ChangeEvent<HTMLInputElement>) => {
		setPayload({
			limit: pageSize,
			searchAll: event.target.checked,
		});
	};

	const scrollHandler = useMemo(() => {
		if (!hasMore) {
			return undefined;
		}

		const throttledTestAndSet = withThrottling({ wait: 200 })((element: HTMLElement) => {
			if (element.scrollTop >= element.scrollHeight - element.clientHeight) {
				setPayload(({ limit, ...rest }) => ({ ...rest, limit: limit + pageSize }));
			}
		});

		return (event: UIEvent<HTMLElement>) => {
			throttledTestAndSet(event.currentTarget);
		};
	}, [hasMore, pageSize]);

	const scrollListRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = scrollListRef.current;
		if (!element) {
			return;
		}

		if (element.scrollTop >= element.scrollHeight - element.clientHeight) {
			setPayload(({ limit, ...rest }) => ({ ...rest, limit: limit + pageSize }));
		}
	}, [pageSize]);

	const room = useRoom();
	const messageContext = useMemo(() => {
		const context = createMessageContext({ rid: room._id });
		return {
			...context,
			settings: {
				...context.settings,
				showReplyButton: false,
				showreply: false,
			},
		};
	}, [room._id]);

	const t = useTranslation();

	return (
		<div className='rocket-search-result'>
			<div className='rocket-default-search-settings'>
				<div>
					{globalSearchEnabled && (
						<label>
							<input type='checkbox' id='global-search' checked={payload.searchAll} onChange={handleToggleGlobalSearch} />
							{t('Global_Search')}
						</label>
					)}
				</div>
			</div>
			<div className='rocket-default-search-results' ref={scrollListRef} onScroll={scrollHandler}>
				{messageSearchQuery.data &&
					(messageSearchQuery.data?.message?.docs.length ? (
						<div className='flex-tab__result js-list'>
							<div className='list clearfix' role='list'>
								{messageSearchQuery.data?.message?.docs.map((message) => (
									<BlazeTemplate
										key={message._id}
										name='message'
										msg={{
											customClass: 'search',
											actionContext: 'search',
											...message,
											searchedText: searchText,
											groupable: false,
										}}
										groupable={true}
										room={messageContext.room}
										subscription={messageContext.subscription}
										settings={messageContext.settings}
										u={messageContext.u}
									/>
								))}
							</div>
						</div>
					) : (
						<States>
							<StatesIcon name='magnifier' />
							<StatesTitle>{t('No_results_found')}</StatesTitle>
						</States>
					))}
				<div className='load-more'>{searchText && messageSearchQuery.isLoading && <LoadingMessagesIndicator />}</div>
			</div>
		</div>
	);
};

export default MessageSearch;
