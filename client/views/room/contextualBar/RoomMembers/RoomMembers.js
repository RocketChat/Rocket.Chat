import React, { useCallback, useMemo, useState } from 'react';
import {
	Box,
	Icon,
	TextInput,
	Field,
	FieldGroup,
	Select,
	Throbber,
	ButtonGroup,
	Button,
	Option,
	Menu,
} from '@rocket.chat/fuselage';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import {
	useResizeObserver,
	useMutableCallback,
	useDebouncedValue,
	useLocalStorage,
} from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { useUserRoom } from '../../../../contexts/UserContext';
import VerticalBar from '../../../../components/VerticalBar';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useMethod } from '../../../../contexts/ServerContext';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { usePermission } from '../../../../contexts/AuthorizationContext';
import { useUserInfoActions, useUserInfoActionsSpread } from '../../hooks/useUserInfoActions';
import { withPreventPropagation } from '../../../../lib/withPreventPropagation';
import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import { useDataWithLoadMore } from './hooks/useDataWithLoadMore';

const MemberOption = React.memo(({ memberData: { _id, status, name, username }, onClickView, rid, style }) => {
	const { menu: menuOptions } = useUserInfoActionsSpread(useUserInfoActions({ _id, username }, rid));

	const menu = useMemo(() => {
		if (!menuOptions) {
			return null;
		}

		return <div><Menu
			flexShrink={0}
			mi='x2'
			key='menu'
			// ghost={false}
			renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />}
			options={menuOptions}
		/></div>;
	}, [menuOptions]);

	return (
		<Option
			id={_id}
			style={style}
			avatar={<UserAvatar username={username} size='x28' />}
			presence={status}
			label={<Box withTruncatedText>{name} <Box is='span' color='neutral-500'>({username})</Box></Box>}
			onClick={() => onClickView(username)}
		>{withPreventPropagation(menu)}</Option>
	);
});

export const RoomMembers = ({
	rid,
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
	loadMoreItems,
}) => {
	const t = useTranslation();

	const isItemLoaded = (index) => !!members[index];

	const memberRenderer = useCallback(({ data, index, style }) => (
		data[index] ? <RoomMembers.Option
			index={index}
			style={style}
			memberData={data[index]}
			onClickView={onClickView}
			rid={rid}
		/> : ''), [onClickView, rid]);

	const options = useMemo(() => [
		['online', t('Online')],
		['all', t('All')],
	], [t]);

	const { ref, contentBoxSize: { blockSize = 200 } = {} } = useResizeObserver({ debounceDelay: 100 });

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='team'/>
				<VerticalBar.Text>{t('Members')}</VerticalBar.Text>
				{ onClickClose && <VerticalBar.Close onClick={onClickClose} /> }
			</VerticalBar.Header>

			<VerticalBar.Content p='x12'>
				<Box width='full' pi='x12' pb='x12' mi='neg-x4'>
					<FieldGroup>
						<Box flexDirection='row' display='flex' justifyContent='stretch'>
							<Box flexGrow={2} flexBasis='85%' mi='x4'>
								<Field>
									<Field.Row>
										<TextInput placeholder={t('Search_by_username')} value={text} onChange={setText} addon={<Icon name='magnifier' size='x20'/>}/>
									</Field.Row>
								</Field>
							</Box>

							<Box flexGrow={1} flexBasis='15%' mi='x4'>
								<Field>
									<Field.Row>
										<Select
											onChange={setType}
											value={type}
											options={options} />
									</Field.Row>
								</Field>
							</Box>
						</Box>
					</FieldGroup>
				</Box>

				{loading && <Box p='x12'><Throbber size='x12' /></Box>}
				{!loading && members.length <= 0 && <Box p='x12'>{t('No_results_found')}</Box>}

				{!loading && members.length > 0 && (
					<Box pi='x12' pb='x12'>
						<Box is='span' color='neutral-500' fontScale='p1'>
							{t('Showing')}: <Box is='span' color='default' fontScale='p2'>{members.length}</Box>
						</Box>

						<Box is='span' color='neutral-500' fontScale='p1' mis='x8'>
							{t('Online')}: <Box is='span' color='default' fontScale='p2'>{members.length}</Box>
						</Box>

						<Box is='span' color='neutral-500' fontScale='p1' mis='x8'>
							{t('Total')}: <Box is='span' color='default' fontScale='p2'>{total}</Box>
						</Box>
					</Box>
				)}

				<Box w='full' h='full' ref={ref}>
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
								itemData={members}
								height={blockSize}
								itemCount={total}
								itemSize={46}
								onItemsRendered={onItemsRendered}
								ref={ref}
							>
								{memberRenderer}
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

RoomMembers.Option = MemberOption;

const useGetUsersOfRoom = (params) => {
	const method = useMethod('getUsersOfRoom');
	return useDataWithLoadMore(useCallback((args) => method(...args), [method]), params);
};

export default ({
	rid,
	tabBar,
}) => {
	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());
	const onClickBack = useMutableCallback(() => tabBar && tabBar.setTemplate('RoomMembers'));
	const room = useUserRoom(rid);
	room.type = room.t;
	room.rid = rid;

	const [type, setType] = useLocalStorage('members-list-type', 'online');
	const [text, setText] = useState('');

	const debouncedText = useDebouncedValue(text, 500);
	const params = useMemo(() => [rid, type === 'all', {}, debouncedText], [rid, type, debouncedText]);

	const { value, phase, more } = useGetUsersOfRoom(params);

	const canAddUsers = usePermission(room.t === 'p' ? 'add-user-to-any-p-room' : 'add-user-to-any-c-room', rid);

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	const viewUser = useMutableCallback((username) => {
		tabBar.setTemplate('UserInfoWithData');
		tabBar.setData({
			username,
			rid,
			full: 1,
			onClose: onClickClose,
			onBack: () => tabBar.set(),
		});
	});

	const createInvite = useMutableCallback(() => {
		if (!tabBar) {
			return;
		}

		tabBar.setTemplate('InviteUsers');
		tabBar.setData({
			rid,
			onClickBack,
			full: 1,
		});
	});

	const addUser = useMutableCallback(() => {
		if (!tabBar) {
			return;
		}

		tabBar.setTemplate('AddUsers');
		tabBar.setData({
			rid,
			onClickBack,
			full: 1,
		});
	});

	const loadMoreItems = (start, end) => more(([rid, type, , filter]) => [rid, type, { skip: start, limit: end - start }, filter], (prev, next) => ({
		total: next.total,
		records: [...prev.records, ...next.records],
	}));

	return (
		<RoomMembers
			rid={rid}
			loading={phase === AsyncStatePhase.LOADING}
			type={type}
			text={text}
			setType={setType}
			setText={handleTextChange}
			members={value?.records}
			total={value?.total}
			onClickClose={onClickClose}
			onClickView={viewUser}
			onClickAdd={canAddUsers && addUser}
			onClickInvite={canAddUsers && createInvite}
			loadMoreItems={loadMoreItems}
		/>
	);
};
