import { OptionAvatar, OptionColumn, OptionContent, OptionInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import ReactiveUserStatus from '../../../../../../client/components/UserStatus/ReactiveUserStatus';
import UserAvatar from '../../../../../../client/components/avatar/UserAvatar';

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

const ComposerBoxPopupUser = ({ _id, system, username, name, nickname, outside, suggestion, variant }: ComposerBoxPopupUserProps) => {
	const t = useTranslation();

	return (
		<>
			{!system && (
				<>
					<OptionAvatar>
						<UserAvatar size='x28' username={username} />
					</OptionAvatar>
					<OptionColumn>
						<ReactiveUserStatus uid={_id} />
					</OptionColumn>
					<OptionContent>
						<strong>{name ?? username}</strong> {name && name !== username && username}
						{nickname && <span className='popup-user-nickname'>({nickname})</span>}
					</OptionContent>
				</>
			)}

			{system && (
				<OptionContent>
					<strong>{username}</strong> {name}
				</OptionContent>
			)}

			{outside && variant === 'large' && (
				<OptionColumn>
					<OptionInput>{t('Not_in_channel')}</OptionInput>
				</OptionColumn>
			)}

			{suggestion && variant === 'large' && (
				<OptionColumn>
					<OptionInput>{t('Suggestion_from_recent_messages')}</OptionInput>
				</OptionColumn>
			)}
		</>
	);
};

export default ComposerBoxPopupUser;
