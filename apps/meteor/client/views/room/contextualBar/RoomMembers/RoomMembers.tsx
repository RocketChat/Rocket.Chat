import type { IRoom } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Icon, TextInput, Select, Throbber, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import {
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
import type { ChangeEventHandler, ComponentProps, MouseEvent, ElementType } from 'react';
import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import RoomMembersRow from './RoomMembersRow';
import { RoomMembersVirtualList } from './RoomMembersVirtualList';
import { buildRoomMembersListRows } from './roomMembersListRows';
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
	setText: ChangeEventHandler<HTMLInputElement>;
	setType: (type: 'online' | 'all') => void;
	members: RoomMember[];
	total: number;
	error?: Error;
	onClickClose: () => void;
	onClickView: (e: MouseEvent<HTMLElement>) => void;
	onClickAdd?: () => void;
	onClickInvite?: () => void;
	loadMoreItems: () => Promise<unknown> | void;
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

	const useRealName = useSetting('UI_Use_Real_Name', false);

	const { rows, stickyIndexes } = useMemo(() => buildRoomMembersListRows(members), [members]);

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
					endAddon={<Icon name='magnifier' size='x20' />}
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
								<RoomMembersVirtualList
									rows={rows}
									stickyIndexes={stickyIndexes}
									loadedMembersCount={members.length}
									total={total}
									loadMoreItems={loadMoreItems}
									listLabel={isTeam ? t('Teams_members') : t('Members')}
									renderMemberRow={(row) => (
										<RowComponent
											is='div'
											role='option'
											useRealName={useRealName}
											data={itemData}
											user={row.member}
											index={row.memberIndex}
											reload={reload}
										/>
									)}
								/>
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
