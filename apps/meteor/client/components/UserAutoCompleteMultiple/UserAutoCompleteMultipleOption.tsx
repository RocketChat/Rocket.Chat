import { Option, OptionDescription } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';

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

	return (
		<Option
			{...props}
			avatar={_federated ? undefined : <UserAvatar username={username || ''} size='x20' />}
			icon={_federated ? 'globe' : undefined}
			key={username}
			label={
				<>
					{name || username} {!_federated && <OptionDescription>({username})</OptionDescription>}
				</>
			}
		/>
	);
};

export default UserAutoCompleteMultipleOption;
