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
import { Virtuoso } from 'react-virtuoso';
import {
	useMutableCallback,
	useDebouncedValue,
	useLocalStorage,
	useAutoFocus,
} from '@rocket.chat/fuselage-hooks';
import memoize from 'memoize-one';

import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useUserRoom } from '../../../../../contexts/UserContext';
import VerticalBar from '../../../../../components/VerticalBar';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useAtLeastOnePermission } from '../../../../../contexts/AuthorizationContext';
import { MemberItem } from './components/MemberItem';
import UserInfoWithData from '../../UserInfo';
import InviteUsers from '../InviteUsers/InviteUsers';
import AddUsers from '../AddUsers/AddUsers';
import { useTabBarClose } from '../../../providers/ToolboxProvider';
import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';
import { useMembersList } from '../../../../hooks/useMembersList';
import { useRecordList } from '../../../../../hooks/lists/useRecordList';

export const createItemData = memoize((onClickView, rid) => ({
	onClickView,
	rid,
}));

const DefaultRow = React.memo(({ user, data, index, reload }) => {
	const { onClickView, rid } = data;

	if (!user) {
		return <RoomMembers.Option.Skeleton />;
	}

	return <RoomMembers.Option
		index={index}
		username={user.username}
		_id={user._id}
		rid={rid}
		status={user.status}
		name={user.name}
		onClickView={onClickView}
		reload={reload}
	/>;
});

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
	error,
	loadMoreItems,
	renderRow: Row = DefaultRow,
	rid,
	reload,
}) => {
	const t = useTranslation();
	const inputRef = useAutoFocus(true);

	const options = useMemo(() => [
		['online', t('Online')],
		['all', t('All')],
	], [t]);

	const itemData = createItemData(onClickView, rid);
	const lm = useMutableCallback((start) => !loading && loadMoreItems(start));

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
							<TextInput placeholder={t('Search_by_username')} value={text} ref={inputRef} onChange={setText} addon={<Icon name='magnifier' size='x20'/>}/>
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

				{error && <Box pi='x24' pb='x12'><Callout type='danger'>
					{error.message}
				</Callout></Box>}

				{!loading && members.length <= 0 && <Box pi='x24' pb='x12'>{t('No_results_found')}</Box>}

				{!loading && members.length > 0 && (
					<Box pi='x18' pb='x12'>
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

				<Box w='full' h='full' overflow='hidden' flexShrink={1}>
					{!loading && members && members.length > 0 && <Virtuoso
						style={{
							height: '100%',
							width: '100%',
						}}
						totalCount={total}
						endReached={lm}
						overscan={50}
						data={members}
						components={{ Scroller: ScrollableContentWrapper }}
						itemContent={(index, data) => <Row
							data={itemData}
							user={data}
							index={index}
							reload={reload}
						/>}
					/>}
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

	const debouncedText = useDebouncedValue(text, 800);

	const { membersList, loadMoreItems, reload } = useMembersList(useMemo(() => ({ rid, type: type === 'all', limit: 50, debouncedText }), [rid, type, debouncedText]));

	const { phase, items, itemCount: total } = useRecordList(membersList);

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

	if (state.tab === 'UserInfo') {
		return <UserInfoWithData rid={rid} onClickClose={onClickClose} onClickBack={handleBack} username={state.username} />;
	}

	if (state.tab === 'InviteUsers') {
		return <InviteUsers onClickClose={onClickClose} rid={rid} onClickBack={handleBack} />;
	}

	if (state.tab === 'AddUsers') {
		return <AddUsers onClickClose={onClickClose} rid={rid} onClickBack={handleBack} reload={reload} />;
	}

	return (
		<RoomMembers
			rid={rid}
			loading={phase === AsyncStatePhase.LOADING}
			type={type}
			text={text}
			setType={setType}
			setText={handleTextChange}
			members={items}
			total={total}
			onClickClose={onClickClose}
			onClickView={viewUser}
			onClickAdd={canAddUsers && addUser}
			onClickInvite={canAddUsers && createInvite}
			loadMoreItems={loadMoreItems}
			reload={reload}
		/>
	);
};
