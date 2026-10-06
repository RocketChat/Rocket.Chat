import { ItemContent, ItemDescription, ItemIcon, ItemMedia, ItemMeta, ItemTitle } from '@rocket.chat/fuselage';
import { ITEM_MEDIA_SIZE, UserAvatar } from '@rocket.chat/ui-avatar';
import { useSetting, useUserPresence } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { getUserDisplayNames } from '../../../../lib/getUserDisplayNames';
import ReactiveUserStatus from '../../../components/UserStatus/ReactiveUserStatus';
import { STATUS_LABEL_KEYS } from '../../../components/UserStatusText';

export type ComposerBoxPopupUserProps = {
	_id: string;
	system?: boolean;
	outside?: boolean;
	suggestion?: boolean;
	username: string;
	name?: string;
	nickname?: string;
	status?: string;
	sort?: number;
	variant?: 'small' | 'large';
};

function ComposerBoxPopupUser({ _id, system, username, name, nickname, outside, suggestion, variant }: ComposerBoxPopupUserProps) {
	const { t } = useTranslation();
	const useRealName = useSetting('UI_Use_Real_Name', false);
	const status = useUserPresence(system ? undefined : _id)?.status;

	const [nameOrUsername, displayUsername] = getUserDisplayNames(name, username, useRealName);

	return (
		<>
			{!system && (
				<>
					<ItemMedia>
						<UserAvatar size={ITEM_MEDIA_SIZE.medium} username={username} />
					</ItemMedia>
					<ItemIcon label={status && t(STATUS_LABEL_KEYS[status])}>
						<ReactiveUserStatus uid={_id} />
					</ItemIcon>
					<ItemContent>
						<ItemTitle>
							{nameOrUsername}
							{displayUsername && <ItemDescription inline>@{displayUsername}</ItemDescription>}
							{nickname && <ItemDescription inline>({nickname})</ItemDescription>}
						</ItemTitle>
					</ItemContent>
				</>
			)}

			{system && (
				<ItemContent>
					<ItemTitle>
						@{username}
						{name && <ItemDescription inline>{name}</ItemDescription>}
					</ItemTitle>
				</ItemContent>
			)}

			{outside && variant === 'large' && <ItemMeta>{t('Not_in_channel')}</ItemMeta>}

			{suggestion && variant === 'large' && <ItemMeta>{t('Suggestion_from_recent_messages')}</ItemMeta>}
		</>
	);
}

export default ComposerBoxPopupUser;
