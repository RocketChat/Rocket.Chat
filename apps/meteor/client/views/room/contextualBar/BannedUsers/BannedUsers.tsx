import { Box, Throbber } from '@rocket.chat/fuselage';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import {
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarDialog,
	ContextualbarEmptyContent,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	VirtualizedScrollbars,
} from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import BannedUsersItem from './BannedUsersItem';
import type { BannedUser } from '../../../hooks/useRoomBannedUsers';

type BannedUsersProps = {
	loading: boolean;
	error?: Error;
	useRealName?: boolean;
	bannedUsers: BannedUser[];
	onClickClose: () => void;
	onClickUnban: (username: string) => void;
	onLoadMore: () => void;
};

const BannedUsers = ({ loading, error, bannedUsers, useRealName = false, onClickClose, onClickUnban, onLoadMore }: BannedUsersProps) => {
	const { t } = useTranslation();

	const loadMoreBannedUsers = useDebouncedCallback(() => onLoadMore(), 300, [onLoadMore, bannedUsers]);

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='ban' />
				<ContextualbarTitle>{t('Banned_Users')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClickClose} />
			</ContextualbarHeader>
			<ContextualbarContent p={0} pb={12}>
				{loading && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}

				{error && <ContextualbarEmptyContent icon='warning' title={t('Banned_users_error')} subtitle={t('Please_try_again')} />}

				{!loading && !error && bannedUsers.length === 0 && (
					<ContextualbarEmptyContent icon='ban' title={t('No_banned_users')} subtitle={t('No_banned_users_description')} />
				)}

				{!loading && !error && bannedUsers.length > 0 && (
					<Box w='full' h='full' overflow='hidden' flexShrink={1}>
						<VirtualizedScrollbars>
							<Virtuoso
								style={{ height: '100%', width: '100%' }}
								data={bannedUsers}
								overscan={50}
								endReached={loadMoreBannedUsers}
								itemContent={(_index, user) => <BannedUsersItem user={user} useRealName={useRealName} onClickUnban={onClickUnban} />}
							/>
						</VirtualizedScrollbars>
					</Box>
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default BannedUsers;
