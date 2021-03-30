import React, { memo, useCallback, useMemo, useState } from 'react';
import { Box, Icon, TextInput, Margins, Select, Throbber, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { Virtuoso } from 'react-virtuoso';
import { useMutableCallback, useLocalStorage, useAutoFocus, useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useSetModal } from '../../../contexts/ModalContext';
import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { RecordList } from '../../../lib/lists/RecordList.ts';
import { TeamChannelItem } from './TeamChannelItem';
import { useTabBarClose } from '../../room/providers/ToolboxProvider';
import { roomTypes } from '../../../../app/utils';
import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../components/VerticalBar';
import AddExistingModal from '../modals/AddExistingModal';
import CreateChannel from '../../../sidebar/header/CreateChannel';
import RoomInfo from '../../room/contextualBar/Info';


const Row = memo(function Row({ room, onClickView }) {
	if (!room) {
		return <BaseTeamChannels.Option.Skeleton />;
	}

	return <BaseTeamChannels.Option
		room={room}
		onClickView={onClickView}
	/>;
});

const BaseTeamChannels = ({
	loading,
	channels = [],
	text,
	type,
	setText,
	setType,
	onClickClose,
	onClickAddExisting,
	onClickCreateNew,
	total,
	loadMoreItems,
	onClickView,
}) => {
	const t = useTranslation();
	const inputRef = useAutoFocus(true);

	const options = useMemo(() => [
		['all', t('All')],
		['autoJoin', t('Auto-join')],
	], [t]);

	const lm = useMutableCallback((start) => loadMoreItems(start, Math.min(50, total - start)));

	console.log(total);
	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='hash'/>
				<VerticalBar.Text>{t('Channels')}</VerticalBar.Text>
				{ onClickClose && <VerticalBar.Close onClick={onClickClose} /> }
			</VerticalBar.Header>

			<VerticalBar.Content p='x12'>
				<Box display='flex' flexDirection='row' p='x12' flexShrink={0}>
					<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline='x4'>
							<TextInput placeholder={t('Search')} value={text} ref={inputRef} onChange={setText} addon={<Icon name='magnifier' size='x20'/>}/>
							<Select
								flexGrow={0}
								width='110px'
								onChange={setType}
								value={type}
								options={options} />
						</Margins>
					</Box>
				</Box>

				{loading && <Box pi='x24' pb='x12'><Throbber size='x12' /></Box>}
				{!loading && channels.length <= 0 && <Box pi='x24' pb='x12'>{t('No_results_found')}</Box>}

				<Box w='full' h='full' overflow='hidden' flexShrink={1}>
					<Virtuoso
						style={{
							height: '100%',
							width: '100%',
						}}
						totalCount={total}
						endReached={loading ? () => {} : lm}
						overscan={50}
						data={channels}
						components={{ Scroller: ScrollableContentWrapper }}
						itemContent={(index, data) => <Row
							onClickView={onClickView}
							room={data}
						/>}
					/>
				</Box>
			</VerticalBar.Content>

			<VerticalBar.Footer>
				<ButtonGroup stretch>
					{ onClickAddExisting && <Button onClick={onClickAddExisting} width='50%'>{t('Team_Add_existing')}</Button> }
					{ onClickCreateNew && <Button onClick={onClickCreateNew} width='50%'>{t('Create_new')}</Button> }
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

BaseTeamChannels.Option = TeamChannelItem;

export const useReactModal = (Component, props) => {
	const setModal = useSetModal();

	return useMutableCallback((e) => {
		e.preventDefault();

		const handleClose = () => {
			setModal(null);
		};

		setModal(() => <Component
			onClose={handleClose}
			{...props}
		/>);
	});
};

const TeamChannels = ({ teamId }) => {
	const [state, setState] = useState({});
	const onClickClose = useTabBarClose();

	const [type, setType] = useLocalStorage('channels-list-type', 'all');
	const [text, setText] = useState('');
	const [roomList] = useState(() => new RecordList());

	const debouncedText = useDebouncedValue(text, 800);

	const roomListEndpoint = useEndpoint('GET', 'teams.listRooms');

	console.log(text, type);


	const fetchData = useCallback(async (start, end) => {
		console.trace();
		const { rooms, total } = await roomListEndpoint({
			teamId,
			offset: start,
			count: end,
			query: JSON.stringify({
				name: { $regex: debouncedText || '', $options: 'i' },
				...type !== 'all' && {
					teamDefault: true,
				},
			}),
		});

		const roomsDated = rooms.map((rooms) => {
			rooms._updatedAt = new Date(rooms._updatedAt);
			return { ...rooms };
		});

		return {
			items: roomsDated,
			itemCount: total,
		};
	}, [roomListEndpoint, teamId, debouncedText, type]);

	const { loadMoreItems } = useScrollableRecordList(roomList, fetchData);

	const { phase, items, itemCount } = useRecordList(roomList);

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	const addExisting = useReactModal(AddExistingModal, { teamId });
	const createNew = useReactModal(CreateChannel, { teamId });

	const goToRoom = useCallback((room) => roomTypes.openRouteLink(room.t, room), []);
	const handleBack = useCallback(() => setState({}), [setState]);
	const viewRoom = useMutableCallback((e) => {
		const { rid } = e.currentTarget.dataset;

		setState({
			tab: 'RoomInfo',
			rid,
		});
	});

	if (state.tab === 'RoomInfo') {
		return <RoomInfo rid={state.rid} onClickClose={onClickClose} onClickBack={handleBack} onEnterRoom={goToRoom} />;
	}

	return (
		<BaseTeamChannels
			loading={phase === 'loading'}
			type={type}
			text={text}
			setType={setType}
			setText={handleTextChange}
			channels={items}
			total={itemCount}
			onClickClose={onClickClose}
			onClickAddExisting={addExisting}
			onClickCreateNew={createNew}
			onClickView={viewRoom}
			loadMoreItems={loadMoreItems}
		/>
	);
};

export default TeamChannels;
