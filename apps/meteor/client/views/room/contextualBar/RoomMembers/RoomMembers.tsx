import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Icon, TextInput, Margins, Select, Throbber, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { useMutableCallback, useAutoFocus, useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, FormEventHandler, ComponentProps, MouseEvent } from 'react';
import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';

import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarFooter,
	ContextualbarEmptyContent,
} from '../../../../components/Contextualbar';
import InfiniteListAnchor from '../../../../components/InfiniteListAnchor';
import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
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
	renderRow: RowComponent = RoomMembersRow,
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

	const loadMoreMembers = useDebouncedCallback(
		() => {
			if (members.length >= total) {
				return;
			}

			loadMore(members.length);
		},
		300,
		[loadMore, members],
	);

	return (
		<>
			<ContextualbarHeader data-qa-id='RoomHeader-Members'>
				<ContextualbarIcon name='members' />
				<ContextualbarTitle>{isTeam ? t('Teams_members') : t('Members')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarContent p='x12'>
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

				{!loading && members.length <= 0 && <ContextualbarEmptyContent title={t('No_members_found')} />}

				{!loading && members && members.length > 0 && (
					<>
						<Box pi='x18' pb='x12'>
							<Box is='span' color='hint' fontScale='p2'>
								{t('Showing')}: {members.length}
							</Box>

							<Box is='span' color='hint' fontScale='p2' mis='x8'>
								{t('Total')}: {total}
							</Box>
						</Box>

						<Box w='full' h='full' overflow='hidden' flexShrink={1}>
							<Virtuoso
								style={{
									height: '100%',
									width: '100%',
								}}
								totalCount={total}
								overscan={50}
								data={members}
								// eslint-disable-next-line react/no-multi-comp
								components={{ Scroller: ScrollableContentWrapper, Footer: () => <InfiniteListAnchor loadMore={loadMoreMembers} /> }}
								itemContent={(index, data): ReactElement => <RowComponent data={itemData} user={data} index={index} reload={reload} />}
							/>
						</Box>
					</>
				)}
			</ContextualbarContent>
			{!isDirect && (onClickInvite || onClickAdd) && (
				<ContextualbarFooter>
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
				</ContextualbarFooter>
			)}
		</>
	);
};

export default RoomMembers;
