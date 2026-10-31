import { Option, OptionDescription } from '@rocket.chat/fuselage';
import { ITEM_MEDIA_SIZE, UserAvatar } from '@rocket.chat/ui-avatar';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import type { UserLabel } from './UserAutoCompleteMultipleOptions';
import { normalizeUsername } from '../../../lib/utils/normalizeUsername';

export type UserAutoCompleteMultipleOptionProps = {
	label: UserLabel;
	value: string | number;
	selected?: boolean;
	focus?: boolean;
	disabled?: boolean;
	role?: string;
	onMouseDown?: MouseEventHandler;
};

const UserAutoCompleteMultipleOption = ({ label, ...props }: UserAutoCompleteMultipleOptionProps) => {
	const { t } = useTranslation();
	const { name, _federated } = label;
	const useRealName = useSetting('UI_Use_Real_Name');
	const username = normalizeUsername(label.username);
	const showName = useRealName && !!name;

	return (
		<Option
			{...props}
			aria-label={username}
			avatar={_federated ? undefined : <UserAvatar username={username || ''} size={ITEM_MEDIA_SIZE.condensed} />}
			icon={_federated ? 'globe' : undefined}
			iconLabel={_federated ? t('Federated') : undefined}
			label={
				<>
					{showName ? name : username}
					{showName && !_federated && <OptionDescription>@{username}</OptionDescription>}
				</>
			}
		/>
	);
};

export default UserAutoCompleteMultipleOption;
