import { Icon, Item, ItemContent, ItemDescription, ItemIcon, ItemMedia, ItemTitle } from '@rocket.chat/fuselage';
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

const UserAutoCompleteMultipleOption = ({
	label,
	value: _value,
	selected,
	focus,
	disabled,
	...props
}: UserAutoCompleteMultipleOptionProps) => {
	const { t } = useTranslation();
	const { name, _federated } = label;
	const useRealName = useSetting('UI_Use_Real_Name');
	const username = normalizeUsername(label.username);
	const showName = useRealName && !!name;

	return (
		<Item
			{...props}
			is='li'
			inset='md'
			selected={selected}
			focused={focus}
			disabled={disabled}
			aria-selected={selected}
			aria-disabled={disabled || undefined}
			aria-label={username}
		>
			{_federated ? (
				<ItemIcon label={t('Federated')}>
					<Icon name='globe' size='x16' />
				</ItemIcon>
			) : (
				<ItemMedia>
					<UserAvatar username={username || ''} size={ITEM_MEDIA_SIZE.condensed} />
				</ItemMedia>
			)}
			<ItemContent>
				<ItemTitle>
					{showName ? name : username}
					{showName && !_federated && <ItemDescription inline>@{username}</ItemDescription>}
				</ItemTitle>
			</ItemContent>
		</Item>
	);
};

export default UserAutoCompleteMultipleOption;
