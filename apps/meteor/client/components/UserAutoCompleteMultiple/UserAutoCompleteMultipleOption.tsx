import type { IUser } from '@rocket.chat/core-typings';
import { Option, OptionDescription } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ReactNode } from 'react';

type UserAutoCompleteMultipleOptionProps = {
	label: ReactNode;
	value: string | number;
	selected?: boolean;
	focus?: boolean;
	role?: string;
};

type UserLabel = {
	_federated?: boolean;
} & Pick<IUser, 'username' | 'name'>;

const UserAutoCompleteMultipleOption = ({ label, ...props }: UserAutoCompleteMultipleOptionProps) => {
	if (!label || typeof label !== 'object' || !('username' in label)) {
		return null;
	}

	const { name, username, _federated } = label as UserLabel;

	return (
		<Option
			{...props}
			data-qa-type='autocomplete-user-option'
			avatar={_federated ? undefined : <UserAvatar username={username || ''} size='x20' />}
			icon={_federated ? 'globe' : undefined}
			key={username}
			label={
				<>
					{name || username} {!_federated && <OptionDescription>({username})</OptionDescription>}
				</>
			}
			children={undefined}
		/>
	);
};

export default UserAutoCompleteMultipleOption;
