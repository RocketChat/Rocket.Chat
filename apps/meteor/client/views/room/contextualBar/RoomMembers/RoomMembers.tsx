import type { IRoom } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Icon, TextInput, Select, Throbber, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { useAutoFocus, useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import {
	VirtualizedScrollbars,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarFooter,
	ContextualbarEmptyContent,
	ContextualbarSection,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { FormEventHandler, ComponentProps, MouseEvent, ElementType } from 'react';
import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupedVirtuoso } from 'react-virtuoso';

import { MembersListDivider } from './MembersListDivider';
import RoomMembersRow from './RoomMembersRow';
import InfiniteListAnchor from '../../../../components/InfiniteListAnchor';
import ResultsLiveRegion from '../../../../components/ResultsLiveRegion';
import type { RoomMember } from '../../../hooks/useMembersList';

type RoomMembersProps = {
	rid: IRoom['_id'];
	isTeam?: boolean;
	isDirect?: boolean;
	isPending: boolean;
	isSuccess: boolean;
	text: string;
	type: string;
	setText: FormEventHandler<HTMLInputElement>;
	setType: (type: 'online' | 'all') => void;
	members: RoomMember[];
	total: number;
	error?: Error;
	onClickClose: () => void;
	onClickView: (e: MouseEvent<HTMLElement>) => void;
	onClickAdd?: () => void;
	onClickInvite?: () => void;
	loadMoreItems: () => void;
	renderRow?: ElementType<ComponentProps<typeof RoomMembersRow>>;
	reload: () => void;
	isABACRoom?: boolean;
};

const RoomMembers = ({
	isPending,
	isSuccess,
	members = [],
	text,
	type = 'online',
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
	isABACRoom = false,
}: RoomMembersProps) => {
	const { t } = useTranslation();
	const membersListId = useId();
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

	const useRealName = useSetting('UI_Use_Real_Name', false);

	const { counts, titles } = useMemo(() => {
		const owners: RoomMember[] = [];
		const leaders: RoomMember[] = [];
		const moderators: RoomMember[] = [];
		const normalMembers: RoomMember[] = [];

		members.forEach((member) => {
			if (member.roles?.includes('owner')) {
				owners.push(member);
			} else if (member.roles?.includes('leader')) {
				leaders.push(member);
			} else if (member.roles?.includes('moderator')) {
				moderators.push(member);
			} else {
				normalMembers.push(member);
			}
		});

		const counts = [];
		const titles = [];

		if (owners.length > 0) {
			counts.push(owners.length);
			titles.push(<MembersListDivider title='Owners' count={owners.length} />);
		}

		if (leaders.length > 0) {
			counts.push(leaders.length);
			titles.push(<MembersListDivider title='Leaders' count={leaders.length} />);
		}

		if (moderators.length > 0) {
			counts.push(moderators.length);
			titles.push(<MembersListDivider title='Moderators' count={moderators.length} />);
		}

		if (normalMembers.length > 0) {
			counts.push(normalMembers.length);
			titles.push(<MembersListDivider title='Members' count={normalMembers.length} />);
		}

		return { counts, titles };
	}, [members]);

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='members' />
				<ContextualbarTitle>{isTeam ? t('Teams_members') : t('Members')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarSection>
				<TextInput
					placeholder={t('Search_by_username')}
					aria-label={t('Search_by_username')}
					aria-controls={isSuccess ? membersListId : undefined}
					value={text}
					ref={inputRef}
					onChange={setText}
					addon={<Icon name='magnifier' size='x20' />}
				/>
				<Box w='x144' mis={8}>
					<Select
						aria-controls={isSuccess ? membersListId : undefined}
						options={options}
						value={type}
						onChange={(value): void => setType(value as 'online' | 'all')}
					/>
				</Box>
			</ContextualbarSection>
			<ContextualbarContent p={0} pb={12}>
				<ResultsLiveRegion shouldAnnounce={isSuccess} itemCount={members.length} />
				{isPending && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}
				{error && (
					<Box pi={24} pb={12}>
						<Callout type='danger'>{error.message}</Callout>
					</Box>
				)}
				{isSuccess && (
					<>
						{members.length > 0 && (
							<Box pi={24} pb={12}>
								<Box is='span' color='hint' fontScale='p2'>
									{t('Showing_current_of_total', { current: members.length, total })}
								</Box>
							</Box>
						)}
						<Box id={membersListId} w='full' h='full' overflow='hidden' flexShrink={1}>
							{members.length <= 0 && <ContextualbarEmptyContent title={t('No_members_found')} />}
							{members.length > 0 && (
								<VirtualizedScrollbars>
									<GroupedVirtuoso
										style={{
											height: '100%',
											width: '100%',
										}}
										overscan={50}
										groupCounts={counts}
										groupContent={(index) => titles[index]}
										// eslint-disable-next-line react/no-multi-comp
										components={{ Footer: () => <InfiniteListAnchor loadMore={loadMoreMembers} /> }}
										itemContent={(index) => (
											<RowComponent useRealName={useRealName} data={itemData} user={members[index]} index={index} reload={reload} />
										)}
									/>
								</VirtualizedScrollbars>
							)}
						</Box>
					</>
				)}
			</ContextualbarContent>
			{!isDirect && (onClickInvite || onClickAdd) && (
				<ContextualbarFooter>
					<ButtonGroup stretch>
						{onClickInvite && (
							<Button
								icon='link'
								onClick={onClickInvite}
								width='50%'
								disabled={isABACRoom}
								title={isABACRoom ? t('Not_available_for_ABAC_enabled_rooms') : undefined}
								aria-label={t('Invite_Link')}
							>
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
		</ContextualbarDialog>
	);
};

export default RoomMembers;
