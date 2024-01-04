import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Icon, TextInput, Select, Throbber, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { useAutoFocus, useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useSetting } from '@rocket.chat/ui-contexts';
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

type RoomMemberUser = Pick<IUser, 'username' | '_id' | 'name' | 'status'>;

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
	loadMoreItems: () => void;
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

	const options: SelectOption[] = useMemo(
		() => [
			['online', t('Online')],
			['all', t('All')],
		],
		[t],
	);

	const loadMoreMembers = useDebouncedCallback(
		() => {
			loadMoreItems();
		},
		300,
		[loadMoreItems, members],
	);

	const useRealName = Boolean(useSetting('UI_Use_Real_Name'));

	return (
		<>
			<ContextualbarHeader data-qa-id='RoomHeader-Members'>
				<ContextualbarIcon name='members' />
				<ContextualbarTitle>{isTeam ? t('Teams_members') : t('Members')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarContent p={12}>
				<Box display='flex' flexDirection='row' p={12} flexShrink={0}>
					<TextInput
						placeholder={t('Search_by_username')}
						value={text}
						ref={inputRef}
						onChange={setText}
						addon={<Icon name='magnifier' size='x20' />}
					/>
					<Box w='x144' mis={8}>
						<Select onChange={(value): void => setType(value as 'online' | 'all')} value={type} options={options} />
					</Box>
				</Box>

				{loading && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}

				{error && (
					<Box pi={12} pb={12}>
						<Callout type='danger'>{error.message}</Callout>
					</Box>
				)}

				{!loading && members.length <= 0 && <ContextualbarEmptyContent title={t('No_members_found')} />}

				{!loading && members.length > 0 && (
					<>
						<Box pi={18} pb={12}>
							<Box is='span' color='hint' fontScale='p2'>
								{t('Showing_current_of_total', { current: members.length, total })}
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
								itemContent={(index, data): ReactElement => (
									<RowComponent useRealName={useRealName} data={itemData} user={data} index={index} reload={reload} />
								)}
							/>
						</Box>
					</>
				)}
			</ContextualbarContent>
			{!isDirect && (onClickInvite || onClickAdd) && (
				<ContextualbarFooter>
					<ButtonGroup stretch>
						{onClickInvite && (
							<Button icon='link' onClick={onClickInvite} width='50%'>
								{t('Invite_Link')}
							</Button>
						)}
						{onClickAdd && (
							<Button icon='user-plus' onClick={onClickAdd} width='50%' primary>
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
