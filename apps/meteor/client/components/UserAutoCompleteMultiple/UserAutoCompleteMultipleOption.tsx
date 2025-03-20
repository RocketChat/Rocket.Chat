import type { IUser } from '@rocket.chat/core-typings';
import { Option, OptionDescription } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ReactElement } from 'react';

type UserAutoCompleteMultipleOptionProps = {
	label: {
		_federated?: boolean;
	} & Pick<IUser, 'username' | 'name'>;
};

const UserAutoCompleteMultipleOption = ({ label, ...props }: UserAutoCompleteMultipleOptionProps): ReactElement => {
	const { name, username, _federated } = label;

	return (
		<Option
			{...props}
			data-qa-type='autocomplete-user-option'
			avatar={_federated ? undefined : <UserAvatar username={username || ''} size='x20' />}
			icon={_federated ? 'globe' : undefined}
			key={username}
			label={
				(
					<>
						{name || username} {!_federated && <OptionDescription>({username})</OptionDescription>}
					</>
				) as any
			}
			children={undefined}
		/>
	);
};

export default UserAutoCompleteMultipleOption;
