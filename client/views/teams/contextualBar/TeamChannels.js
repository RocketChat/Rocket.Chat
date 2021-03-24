import React, { memo, useCallback, useMemo, useState } from 'react';
import { Box, Icon, TextInput, Margins, Select, Throbber, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { Virtuoso } from 'react-virtuoso';
import { useMutableCallback, useLocalStorage, useAutoFocus } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useSetModal } from '../../../contexts/ModalContext';
import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { RecordList } from '../../../lib/lists/RecordList.ts';
import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../components/VerticalBar';
import AddExistingModal from '../modals/AddExistingModal';
import { TeamChannelItem } from './TeamChannelItem';
import CreateChannel from '../../../sidebar/header/CreateChannel';

const Row = memo(function Row({ room }) {
	if (!room) {
		return <BaseTeamChannels.Option.Skeleton />;
	}

	return <BaseTeamChannels.Option
		room={room}
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
}) => {
	const t = useTranslation();
	const inputRef = useAutoFocus(true);

	const options = useMemo(() => [
		['all', t('All')],
		['autoJoin', t('Auto-join')],
	], [t]);

	const lm = useMutableCallback((start) => loadMoreItems(start + 1, Math.min(50, start + 1 - channels.length)));

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
					{!loading && channels && channels.length > 0 && <Virtuoso
						style={{ height: '100%', width: '100%' }}
						totalCount={total}
						endReached={lm}
						overscan={50}
						data={channels}
						components={{ Scroller: ScrollableContentWrapper }}
						itemContent={(index, data) => <Row
							room={data}
						/>}
					/>}
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

function TeamChannels({ teamId, tabBar }) {
	const [type, setType] = useLocalStorage('channels-list-type', 'all');
	const [text, setText] = useState('');
	const [roomList] = useState(() => new RecordList());

	const roomListEndpoint = useEndpoint('GET', 'teams.listRooms');

	const fetchData = useCallback(async (/* start, end*/) => {
		const { rooms, total } = await roomListEndpoint({ teamId });

		const roomsDated = rooms.map((rooms) => {
			rooms._updatedAt = new Date(rooms._updatedAt);
			return { ...rooms };
		});
		return {
			items: roomsDated,
			itemCount: total,
		};
	}, [roomListEndpoint, teamId]);

	const { loadMoreItems } = useScrollableRecordList(
		roomList,
		fetchData,
	);
	const { phase, items, itemCount } = useRecordList(roomList);

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	const addExisting = useReactModal(AddExistingModal, { teamId });

	const createNew = useReactModal(CreateChannel, { teamId });

	return (
		<BaseTeamChannels
			loading={phase === 'loading'}
			type={type}
			text={text}
			setType={setType}
			setText={handleTextChange}
			channels={items}
			total={itemCount}
			onClickClose={tabBar.close}
			onClickAddExisting={addExisting}
			onClickCreateNew={createNew}
			loadMoreItems={loadMoreItems}
		/>
	);
}

export default TeamChannels;
