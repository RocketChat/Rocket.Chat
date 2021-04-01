import React, { memo, useCallback, useMemo, useState } from 'react';
import { Box, Icon, TextInput, Margins, Select, Throbber, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { Virtuoso } from 'react-virtuoso';
import { useMutableCallback, useLocalStorage, useAutoFocus, useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { useSetModal } from '../../../../contexts/ModalContext';
import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { TeamsChannelItem } from './TeamsChannelItem';
import { useTabBarClose } from '../../../room/providers/ToolboxProvider';
import { roomTypes } from '../../../../../app/utils';
import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../../components/VerticalBar';
import AddExistingModal from './AddExistingModal';
import CreateChannel from '../../../../sidebar/header/CreateChannel';
import RoomInfo from '../../../room/contextualBar/Info';
import { useTeamsChannelList } from './hooks/useTeamsChannelList';
import { AsyncStatePhase } from '../../../../lib/asyncState';

const Row = memo(function Row({ room, onClickView, reload }) {
	if (!room) {
		return <BaseTeamsChannels.Option.Skeleton />;
	}

	return <BaseTeamsChannels.Option
		room={room}
		onClickView={onClickView}
		reload={reload}
	/>;
});

const BaseTeamsChannels = ({
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
	reload,
}) => {
	const t = useTranslation();
	const inputRef = useAutoFocus(true);

	const options = useMemo(() => [
		['all', t('All')],
		['autoJoin', t('Auto-join')],
	], [t]);

	const lm = useMutableCallback((start) => !loading && loadMoreItems(start));

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='hash'/>
				<VerticalBar.Text>{t('Team_Channels')}</VerticalBar.Text>
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
				{!loading && channels.length === 0 && <Box pi='x24' pb='x12'>{t('No_results_found')}</Box>}
				{!loading && <Box w='full' h='full' overflow='hidden' flexShrink={1}>
					<Virtuoso
						totalCount={total}
						endReached={lm}
						data={channels}
						components={{ Scroller: ScrollableContentWrapper }}
						itemContent={(index, data) => <Row
							onClickView={onClickView}
							room={data}
							reload={reload}
						/>}
					/>
				</Box>}
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

const TeamsChannels = ({ teamId }) => {
	const [state, setState] = useState({});
	const onClickClose = useTabBarClose();

	const [type, setType] = useLocalStorage('channels-list-type', 'all');
	const [text, setText] = useState('');

	const debouncedText = useDebouncedValue(text, 800);

	const { teamsChannelList, loadMoreItems, reload } = useTeamsChannelList(useMemo(() => ({ teamId, text: debouncedText, type }), [teamId, debouncedText, type]));

	const { phase, items, itemCount: total } = useRecordList(teamsChannelList);

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	const addExisting = useReactModal(AddExistingModal, { teamId, reload });
	const createNew = useReactModal(CreateChannel, { teamId, reload });

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
		<BaseTeamsChannels
			loading={phase === AsyncStatePhase.LOADING}
			type={type}
			text={text}
			setType={setType}
			setText={handleTextChange}
			channels={items}
			total={total}
			onClickClose={onClickClose}
			onClickAddExisting={addExisting}
			onClickCreateNew={createNew}
			onClickView={viewRoom}
			loadMoreItems={loadMoreItems}
			reload={reload}
		/>
	);
};

BaseTeamsChannels.Option = TeamsChannelItem;

export default TeamsChannels;
