import {
	useDebouncedValue,
	useLocalStorage,
	useMutableCallback,
} from '@rocket.chat/fuselage-hooks';
import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { useCurrentRoute, useRoute } from '../../../../../../client/contexts/RouterContext';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useRecordList } from '../../../../../../client/hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../../../client/lib/asyncState';
import { useRoom } from '../../../../../../client/views/room/contexts/RoomContext';
import { useCannedResponseList } from '../../../hooks/useCannedResponseList';
import CannedResponseList from './CannedResponseList';

export const WrapCannedResponseList: FC<{ tabBar: any }> = ({ tabBar }) => {
	const t = useTranslation();

	const room = useRoom();
	const [name] = useCurrentRoute();
	const channelRoute = useRoute(name || '');

	const onClickItem = useMutableCallback((data) => {
		const { _id: context } = data;

		channelRoute &&
			channelRoute.push({
				id: room._id,
				tab: 'canned-responses',
				context,
			});
	});

	const onClickUse = (e: any): void => {
		e.preventDefault();
		e.stopPropagation();

		console.log('use');
	};

	const onClickCreate = (): void => {
		console.log('create');
	};

	const options: [string, string][] = useMemo(
		() => [
			['all', t('All')],
			['global', t('Public')],
			['user', t('Private')],
			// TODO departments
		],
		[t],
	);

	const [text, setText] = useState('');
	const [type, setType] = useLocalStorage('canned-response-list-type', 'all');

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	const debouncedText = useDebouncedValue(text, 400);

	const { cannedList, loadMoreItems } = useCannedResponseList(
		useMemo(() => ({ filter: debouncedText, type }), [debouncedText, type]),
	);
	const { phase, items, itemCount } = useRecordList(cannedList);

	return (
		<CannedResponseList
			loadMoreItems={loadMoreItems}
			cannedItems={items}
			itemCount={itemCount}
			onClose={tabBar.close}
			loading={phase === AsyncStatePhase.LOADING}
			options={options}
			text={text}
			setText={handleTextChange}
			type={type}
			setType={setType}
			onClickUse={onClickUse}
			onClickItem={onClickItem}
			onClickCreate={onClickCreate}
		/>
	);
};

export default memo(WrapCannedResponseList);
