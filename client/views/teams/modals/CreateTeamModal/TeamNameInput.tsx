import { Icon, TextInput, TextInputProps } from '@rocket.chat/fuselage';
import React, { FC, useMemo } from 'react';

type TeamNameInputProps = TextInputProps & {
	private: boolean;
};

const TeamNameInput: FC<TeamNameInputProps> = ({ private: _private = true, ...props }) => {
	const addon = useMemo(() => <Icon name={_private ? 'team-lock' : 'team'} size='x20' />, [_private]);

	return <TextInput {...props} addon={addon} />;
};

export default TeamNameInput;
