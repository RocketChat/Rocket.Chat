import { IRoom, IUser } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput, Margins, Select, Throbber, ButtonGroup, Button, Callout, SelectOption } from '@rocket.chat/fuselage';
import { useMutableCallback, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, ReactElement, FormEventHandler, ComponentProps, MouseEvent } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../../components/VerticalBar';
import RoomMembersRow from './RoomMembersRow';

type RoomMemberUser = Pick<IUser, 'username' | '_id' | '_updatedAt' | 'name' | 'status'>;

type RoomMembersProps = {
	rid: IRoom['_id'];
	isTeam?: boolean;
	isDirect?: boolean;
	loading: boolean;
	text: string;
	type: string;
	setText: FormEventHandler<HTMLElement>;
	setType: (type: 'online' | 'all') => void;
	members: RoomMemberUser[];
	total: number;
	error?: Error;
	onClickClose: () => void;
	onClickView: (e: MouseEvent<HTMLElement>) => void;
	onClickAdd?: () => void;
	onClickInvite?: () => void;
	loadMoreItems: (start: number, end: number) => void;
	renderRow?: (props: ComponentProps<typeof RoomMembersRow>) => ReactElement | null;
	reload: () => void;
};

const RoomMembers = ({
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
	renderRow: Row = RoomMembersRow,
	rid,
	isTeam,
	isDirect,
	reload,
}: RoomMembersProps): ReactElement => {
	const t = useTranslation();
	const inputRef = useAutoFocus<HTMLInputElement>(true);
	const itemData = useMemo(() => ({ onClickView, rid }), [onClickView, rid]);
	const loadMore = useMutableCallback((start) => !loading && loadMoreItems(start, Math.min(50, total - start)));

	const options: SelectOption[] = useMemo(
		() => [
			['online', t('Online')],
			['all', t('All')],
		],
		[t],
	);

	return (
		<>
			<VerticalBar.Header data-qa-id='RoomHeader-Members'>
				<VerticalBar.Icon name='members' />
				<VerticalBar.Text>{isTeam ? t('Teams_members') : t('Members')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.Content p='x12'>
				<Box display='flex' flexDirection='row' p='x12' flexShrink={0}>
					<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline='x4'>
							<TextInput
								placeholder={t('Search_by_username')}
								value={text}
								ref={inputRef}
								onChange={setText}
								addon={<Icon name='magnifier' size='x20' />}
							/>
							<Select
								flexGrow={0}
								width='110px'
								onChange={(value): void => setType(value as 'online' | 'all')}
								value={type}
								options={options}
							/>
						</Margins>
					</Box>
				</Box>

				{loading && (
					<Box pi='x24' pb='x12'>
						<Throbber size='x12' />
					</Box>
				)}

				{error && (
					<Box pi='x12' pb='x12'>
						<Callout type='danger'>{error.message}</Callout>
					</Box>
				)}

				{!loading && members.length <= 0 && (
					<Box textAlign='center' p='x12' color='neutral-600'>
						{t('No_members_found')}
					</Box>
				)}

				{!loading && members.length > 0 && (
					<Box pi='x18' pb='x12'>
						<Box is='span' color='info' fontScale='p2'>
							{t('Showing')}: {members.length}
						</Box>

						<Box is='span' color='info' fontScale='p2' mis='x8'>
							{t('Total')}: {total}
						</Box>
					</Box>
				)}

				<Box w='full' h='full' overflow='hidden' flexShrink={1}>
					{!loading && members && members.length > 0 && (
						<Virtuoso
							style={{
								height: '100%',
								width: '100%',
							}}
							totalCount={total}
							endReached={loadMore}
							overscan={50}
							data={members}
							components={{ Scroller: ScrollableContentWrapper }}
							itemContent={(index, data): ReactElement => <Row data={itemData} user={data} index={index} reload={reload} />}
						/>
					)}
				</Box>
			</VerticalBar.Content>
			{!isDirect && (onClickInvite || onClickAdd) && (
				<VerticalBar.Footer>
					<ButtonGroup stretch>
						{onClickInvite && (
							<Button onClick={onClickInvite} width='50%'>
								<Icon name='link' size='x20' mie='x4' />
								{t('Invite_Link')}
							</Button>
						)}
						{onClickAdd && (
							<Button onClick={onClickAdd} width='50%' primary>
								<Icon name='user-plus' size='x20' mie='x4' />
								{t('Add')}
							</Button>
						)}
					</ButtonGroup>
				</VerticalBar.Footer>
			)}
		</>
	);
};

export default RoomMembers;
