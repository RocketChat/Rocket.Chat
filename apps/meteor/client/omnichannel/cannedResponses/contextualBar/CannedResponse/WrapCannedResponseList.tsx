import type { IOmnichannelCannedResponse, ILivechatDepartment } from '@rocket.chat/core-typings';
import { useDebouncedValue, useLocalStorage, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useRouter } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, MouseEvent } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';

import CannedResponseList from './CannedResponseList';
import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { useIsRoomOverMacLimit } from '../../../../hooks/omnichannel/useIsRoomOverMacLimit';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { useChat } from '../../../../views/room/contexts/ChatContext';
import { useRoom } from '../../../../views/room/contexts/RoomContext';
import { useRoomToolbox } from '../../../../views/room/contexts/RoomToolboxContext';
import { useCannedResponseFilterOptions } from '../../../hooks/useCannedResponseFilterOptions';
import { useCannedResponseList } from '../../../hooks/useCannedResponseList';
import CreateCannedResponse from '../../modals/CreateCannedResponse';

export const WrapCannedResponseList = () => {
	const room = useRoom();
	const { closeTab } = useRoomToolbox();
	const router = useRouter();
	const setModal = useSetModal();

	const options = useCannedResponseFilterOptions() as [string, string][];

	const [text, setText] = useState('');
	const [type, setType] = useLocalStorage('canned-response-list-type', 'all');

	const isRoomOverMacLimit = useIsRoomOverMacLimit(room);

	const handleTextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setText(event.currentTarget.value);
	}, []);

	const debouncedText = useDebouncedValue(text, 400);

	const { cannedList, loadMoreItems, reload } = useCannedResponseList(
		useMemo(() => ({ filter: debouncedText, type }), [debouncedText, type]),
	);
	const { phase, items, itemCount } = useRecordList(cannedList);

	const onClickItem = useEffectEvent(
		(
			data: IOmnichannelCannedResponse & {
				departmentName: ILivechatDepartment['name'];
			},
		) => {
			const { _id: context } = data;

			router.navigate({
				name: router.getRouteName() ?? 'live',
				params: {
					id: room._id,
					tab: 'canned-responses',
					context,
				},
			});
		},
	);

	const composer = useChat()?.composer;

	const onClickUse = (e: MouseEvent<HTMLOrSVGElement>, text: string): void => {
		e.preventDefault();
		e.stopPropagation();

		composer?.setText(text);
		composer?.focus();
	};

	const onClickCreate = (): void => {
		setModal(<CreateCannedResponse onClose={() => setModal(null)} reloadCannedList={reload} />);
	};

	return (
		<CannedResponseList
			loadMoreItems={loadMoreItems}
			cannedItems={items}
			itemCount={itemCount}
			onClose={closeTab}
			loading={phase === AsyncStatePhase.LOADING}
			options={options}
			text={text}
			setText={handleTextChange}
			type={type}
			setType={setType}
			isRoomOverMacLimit={isRoomOverMacLimit}
			onClickUse={onClickUse}
			onClickItem={onClickItem}
			onClickCreate={onClickCreate}
			reload={reload}
		/>
	);
};

export default memo(WrapCannedResponseList);
