import React, { useCallback, useMemo, useState } from 'react';
import {
	Box,
	Icon,
	TextInput,
	Margins,
	Select,
	Throbber,
	ButtonGroup,
	Button,
	Callout,
} from '@rocket.chat/fuselage';
import { FixedSizeList as List, areEqual } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import {
	useResizeObserver,
	useMutableCallback,
	useDebouncedValue,
	useLocalStorage,
} from '@rocket.chat/fuselage-hooks';
import memoize from 'memoize-one';

import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useUserRoom } from '../../../../../contexts/UserContext';
import VerticalBar from '../../../../../components/VerticalBar';
import { useMethod } from '../../../../../contexts/ServerContext';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useAtLeastOnePermission } from '../../../../../contexts/AuthorizationContext';
import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';
import { useDataWithLoadMore } from '../../hooks/useDataWithLoadMore';
import { MemberItem } from './components/MemberItem';
import UserInfoWithData from '../../UserInfo';
import InviteUsers from '../InviteUsers/InviteUsers';
import AddUsers from '../AddUsers/AddUsers';
import { useTabBarClose } from '../../../providers/ToolboxProvider';

export const createItemData = memoize((items, onClickView, rid) => ({
	items,
	onClickView,
	rid,
}));

const Row = React.memo(({ data, index, style }) => {
	const { onClickView, items, rid } = data;
	const user = items[index];

	if (!user) {
		return <RoomMembers.Option.Skeleton style={style}/>;
	}

	return <RoomMembers.Option
		index={index}
		style={style}
		username={user.username}
		_id={user._id}
		rid={rid}
		status={user.status}
		name={user.name}
		onClickView={onClickView}
	/>;
}, areEqual);

export const RoomMembers = ({
	loading,
	members = [],
	text,
	type,
	setText,
	setType,
	onClickClose,
	onClickView,
	onClickAdd,
	onClickInvite,
	total,
	limit,
	error,
	loadMoreItems,
	rid,
}) => {
	const t = useTranslation();

	const isItemLoaded = (index) => !!members[index];

	const options = useMemo(() => [
		['online', t('Online')],
		['all', t('All')],
	], [t]);

	const { ref, contentBoxSize: { blockSize = 780 } = {} } = useResizeObserver({ debounceDelay: 100 });

	const itemData = createItemData(members, onClickView, rid);

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='team'/>
				<VerticalBar.Text>{t('Members')}</VerticalBar.Text>
				{ onClickClose && <VerticalBar.Close onClick={onClickClose} /> }
			</VerticalBar.Header>

			<VerticalBar.Content p='x12'>
				<Box display='flex' flexDirection='row' p='x12' flexShrink={0}>
					<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline='x4'>
							<TextInput placeholder={t('Search_by_username')} value={text} onChange={setText} addon={<Icon name='magnifier' size='x20'/>}/>
							<Select
								flexGrow={0}
								width='110px'
								onChange={setType}
								value={type}
								options={options} />
						</Margins>
					</Box>
				</Box>

				{ error && <Box pi='x24' pb='x12'><Callout type='danger'>
					{error}
				</Callout></Box> }

				{loading && <Box pi='x24' pb='x12'><Throbber size='x12' /></Box>}
				{!loading && members.length <= 0 && <Box pi='x24' pb='x12'>{t('No_results_found')}</Box>}

				{!loading && members.length > 0 && (
					<Box pi='x24' pb='x12'>
						<Box is='span' color='info' fontScale='p1'>
							{t('Showing')}: <Box is='span' color='default' fontScale='p2'>{members.length}</Box>
						</Box>

						{/* <Box is='span' color='info' fontScale='p1' mis='x8'>
							{t('Online')}: <Box is='span' color='default' fontScale='p2'>{members.length}</Box>
						</Box> */}

						<Box is='span' color='info' fontScale='p1' mis='x8'>
							{t('Total')}: <Box is='span' color='default' fontScale='p2'>{total}</Box>
						</Box>
					</Box>
				)}

				<Box w='full' h='full' overflow='hidden' flexShrink={1} ref={ref}>
					{!loading && members
					&& <InfiniteLoader
						isItemLoaded={isItemLoaded}
						itemCount={total}
						loadMoreItems={loadMoreItems}
					>
						{({ onItemsRendered, ref }) => (
							<List
								outerElementType={ScrollableContentWrapper}
								className='List'
								itemData={itemData}
								height={blockSize}
								itemCount={limit}
								itemSize={36}
								onItemsRendered={onItemsRendered}
								ref={ref}
							>
								{Row}
							</List>
						)}
					</InfiniteLoader>
					}
				</Box>
			</VerticalBar.Content>

			<VerticalBar.Footer>
				<ButtonGroup stretch>
					{ onClickInvite && <Button onClick={onClickInvite} width='50%'><Box is='span' mie='x4'><Icon name='link' size='x20' /></Box>{t('Invite_Link')}</Button> }
					{ onClickAdd && <Button onClick={onClickAdd} width='50%' primary><Box is='span' mie='x4'><Icon name='user-plus' size='x20' /></Box>{t('Add_users')}</Button> }
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

RoomMembers.Option = MemberItem;

const useGetUsersOfRoom = (params) => {
	const method = useMethod('getUsersOfRoom');
	return useDataWithLoadMore(useCallback((args) => method(...args), [method]), params);
};

export default ({
	rid,
}) => {
	const [state, setState] = useState({});
	const onClickClose = useTabBarClose();
	const room = useUserRoom(rid);
	room.type = room.t;
	room.rid = rid;

	const [type, setType] = useLocalStorage('members-list-type', 'online');
	const [text, setText] = useState('');

	const debouncedText = useDebouncedValue(text, 500);
	const params = useMemo(() => [rid, type === 'all', { limit: 50 }, debouncedText], [rid, type, debouncedText]);

	const { value, phase, more, error } = useGetUsersOfRoom(params);

	const canAddUsers = useAtLeastOnePermission(useMemo(() => [room.t === 'p' ? 'add-user-to-any-p-room' : 'add-user-to-any-c-room', 'add-user-to-joined-room'], [room.t]), rid);

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	const viewUser = useMutableCallback((e) => {
		const { username } = e.currentTarget.dataset;
		setState({
			tab: 'UserInfo',
			username,
		});
	});

	const createInvite = useMutableCallback(() => {
		setState({ tab: 'InviteUsers' });
	});

	const addUser = useMutableCallback(() => {
		setState({ tab: 'AddUsers' });
	});

	const handleBack = useCallback(() => setState({}), [setState]);

	const loadMoreItems = useCallback((start, end) => more(([rid, type, , filter]) => [rid, type, { skip: start, limit: end - start }, filter], (prev, next) => ({
		total: next.total,
		finished: next.records.length < 50,
		records: [...prev.records, ...next.records],
	})), [more]);

	if (state.tab === 'UserInfo') {
		return <UserInfoWithData rid={rid} onClickClose={onClickClose} onClickBack={handleBack} username={state.username} />;
	}

	if (state.tab === 'InviteUsers') {
		return <InviteUsers onClickClose={onClickClose} rid={rid} onClickBack={handleBack} />;
	}

	if (state.tab === 'AddUsers') {
		return <AddUsers onClickClose={onClickClose} rid={rid} onClickBack={handleBack} />;
	}

	return (
		<RoomMembers
			rid={rid}
			loading={phase === AsyncStatePhase.LOADING}
			type={type}
			text={text}
			error={error}
			setType={setType}
			setText={handleTextChange}
			members={value?.records}
			total={value?.total}
			limit={ value?.finished || value?.records.length < 50 ? value?.records.length : value?.records.length + 50}
			onClickClose={onClickClose}
			onClickView={viewUser}
			onClickAdd={canAddUsers && addUser}
			onClickInvite={canAddUsers && createInvite}
			loadMoreItems={loadMoreItems}
		/>
	);
};
