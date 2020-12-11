import React, { useCallback, useMemo, useState } from 'react';
import {
	Box,
	Icon,
	TextInput,
	Field,
	FieldGroup,
	Select,
	Throbber,
	Margins,
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
import { useMethodData } from '../../../../hooks/useMethodData';
import { usePermission } from '../../../../contexts/AuthorizationContext';
import { useUserInfoActions, useUserInfoActionsSpread } from '../../hooks/useUserInfoActions';
import { withPreventPropagation } from '../../../../lib/withPreventPropagation';

const LOADING = 1;
const LOADED = 2;
const itemStatusMap = {};

const MemberOption = ({ memberData: { _id, status, name, username }, onClickView, rid }) => {
	const { menu: menuOptions } = useUserInfoActionsSpread(useUserInfoActions({ _id, username }, rid));

	const menu = useMemo(() => {
		if (!menuOptions) {
			return null;
		}

		return <div><Menu
			flexShrink={0}
			mi='x2'
			key='menu'
			ghost={false}
			renderItem={({ label: { label, icon }, ...props }) => <Option {...props} label={label} icon={icon} />}
			options={menuOptions}
		/></div>;
	}, [menuOptions]);

	return (
		<Option
			id={_id}
			avatar={<UserAvatar username={username} size='x28' />}
			presence={status}
			label={<Box withTruncatedText>{name} <Box is='span' color='neutral-500'>({username})</Box></Box>}
			onClick={() => onClickView(username)}
		>{withPreventPropagation(menu)}</Option>
	);
};

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
	canAddUsers,
}) => {
	const t = useTranslation();
	const isItemLoaded = (index) => !!itemStatusMap[index];

	const loadMoreItems = (offset, count, startIndex, stopIndex) => {
		for (let index = startIndex; index <= stopIndex; index++) {
			itemStatusMap[index] = LOADING;
		}
		return new Promise((resolve) =>
			setTimeout(() => {
				for (let index = startIndex; index <= stopIndex; index++) {
					itemStatusMap[index] = LOADED;
				}
				resolve();
			}, 2500),
		);
	};

	const memberRenderer = useCallback(({ data, index, style }) => (
		<RoomMembers.Option
			data={data}
			index={index}
			style={style}
			memberData={members[index]}
			onClickView={onClickView}
			rid={rid}
		/>), [onClickView, members, rid]);

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
					</Box>
				)}

				<Box w='full' h='full' ref={ref}>
					<Margins all='none'>
						<InfiniteLoader
							isItemLoaded={isItemLoaded}
							itemCount={members.length}
							loadMoreItems={loadMoreItems}
						>
							{({ onItemsRendered, ref }) => (
								<List
									className='List'
									height={blockSize}
									itemCount={members.length}
									itemSize={46}
									onItemsRendered={onItemsRendered}
									ref={ref}
								>
									{memberRenderer}
								</List>
							)}
						</InfiniteLoader>
					</Margins>
				</Box>
			</VerticalBar.Content>

			<VerticalBar.Footer>
				<ButtonGroup stretch>
					{ canAddUsers && onClickInvite && <Button onClick={onClickInvite} width='50%'><Box is='span' mie='x4'><Icon name='link' size='x20' /></Box>{t('Invite_Link')}</Button> }
					{ canAddUsers && onClickAdd && <Button onClick={onClickAdd} width='50%' primary><Box is='span' mie='x4'><Icon name='user-plus' size='x20' /></Box>{t('Add_users')}</Button> }
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

RoomMembers.Option = MemberOption;

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

	const { value, phase } = useMethodData('getUsersOfRoom', params);
	const canAddUsers = usePermission(room.t === 'p' ? 'add-user-to-any-p-room' : 'add-user-to-any-c-room', rid);

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	const viewUser = (username) => {
		tabBar.setTemplate('UserInfoWithData');
		tabBar.setData({
			username,
			rid,
			full: 1,
			onClose: onClickClose,
			onBack: () => tabBar.set(),
		});
	};

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

	return (
		<RoomMembers
			rid={rid}
			loading={phase === 'loading' && true}
			type={type}
			text={text}
			setType={setType}
			setText={handleTextChange}
			members={phase === 'resolved' && value.records}
			onClickClose={onClickClose}
			onClickView={viewUser}
			onClickAdd={addUser}
			onClickInvite={createInvite}
			canAddUsers={canAddUsers}
		/>
	);
};
