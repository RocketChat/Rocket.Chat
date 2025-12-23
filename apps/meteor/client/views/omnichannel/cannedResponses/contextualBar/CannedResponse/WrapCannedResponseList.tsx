import type { IOmnichannelCannedResponse, ILivechatDepartment } from '@rocket.chat/core-typings';
import { useDebouncedValue, useLocalStorage, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useRouter, useRoomToolbox } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, MouseEvent } from 'react';
import { memo, useCallback, useState } from 'react';

import CannedResponseList from './CannedResponseList';
import { useChat } from '../../../../room/contexts/ChatContext';
import { useRoom } from '../../../../room/contexts/RoomContext';
import { useCannedResponseFilterOptions } from '../../../hooks/useCannedResponseFilterOptions';
import { useCannedResponseList } from '../../../hooks/useCannedResponseList';
import { useIsRoomOverMacLimit } from '../../../hooks/useIsRoomOverMacLimit';
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

	const { data, fetchNextPage, refetch } = useCannedResponseList({ filter: debouncedText, type });

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
		setModal(<CreateCannedResponse onClose={() => setModal(null)} reloadCannedList={refetch} />);
	};

	return (
		<CannedResponseList
			loadMoreItems={fetchNextPage}
			cannedItems={data?.cannedItems ?? []}
			itemCount={data?.total ?? 0}
			onClose={closeTab}
			options={options}
			text={text}
			setText={handleTextChange}
			type={type}
			setType={setType}
			isRoomOverMacLimit={isRoomOverMacLimit}
			onClickUse={onClickUse}
			onClickItem={onClickItem}
			onClickCreate={onClickCreate}
			reload={refetch}
		/>
	);
};

export default memo(WrapCannedResponseList);
