import { Icon, TextInput, TextInputProps } from '@rocket.chat/fuselage';
import React, { forwardRef, useMemo } from 'react';

type TeamNameInputProps = TextInputProps & {
	private: boolean;
};

const TeamNameInput = forwardRef<HTMLElement, TeamNameInputProps>(function TeamNameInput(
	{ private: _private = true, ...props },
	ref,
) {
	const addon = useMemo(
		() => <Icon name={_private ? 'team-lock' : 'team'} size='x20' />,
		[_private],
	);

	return <TextInput ref={ref} {...props} addon={addon} />;
});

export default TeamNameInput;
