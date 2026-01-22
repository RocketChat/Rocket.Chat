import { Option, OptionDescription } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { UserLabel } from './UserAutoCompleteMultipleOptions';

type UserAutoCompleteMultipleOptionProps = {
	label: UserLabel;
	value: string | number;
	selected?: boolean;
	focus?: boolean;
	role?: string;
};

const UserAutoCompleteMultipleOption = ({ label, ...props }: UserAutoCompleteMultipleOptionProps) => {
	const { name, username, _federated } = label;
	const useRealName = useSetting('UI_Use_Real_Name');

	const optionLabel = useMemo(() => {
		if (!useRealName || !name) {
			return <>{username}</>;
		}

		return (
			<>
				{name} {!_federated && <OptionDescription>({username})</OptionDescription>}
			</>
		);
	}, [_federated, name, useRealName, username]);

	return (
		<Option
			{...props}
			aria-label={username}
			avatar={_federated ? undefined : <UserAvatar username={username || ''} size='x20' />}
			icon={_federated ? 'globe' : undefined}
			key={username}
			label={optionLabel}
		/>
	);
};

export default UserAutoCompleteMultipleOption;
