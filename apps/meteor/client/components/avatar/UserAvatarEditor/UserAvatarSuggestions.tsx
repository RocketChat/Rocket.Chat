import type { AvatarObject } from '@rocket.chat/core-typings';
import { Box, Button, Margins, Avatar } from '@rocket.chat/fuselage';
import React, { useCallback } from 'react';

import { useAvatarSuggestions } from '../../../hooks/useAvatarSuggestions';

type UserAvatarSuggestionsProps = {
	setAvatarObj: (obj: AvatarObject) => void;
	setNewAvatarSource: (source: string) => void;
	disabled?: boolean;
};

const UserAvatarSuggestions = ({ setAvatarObj, setNewAvatarSource, disabled }: UserAvatarSuggestionsProps) => {
	const handleClick = useCallback(
		(suggestion) => () => {
			setAvatarObj(suggestion);
			setNewAvatarSource(suggestion.blob);
		},
		[setAvatarObj, setNewAvatarSource],
	);

	const { data } = useAvatarSuggestions();
	const suggestions = Object.values(data?.suggestions || {});

	return (
		<Margins inline='x4'>
			{suggestions &&
				suggestions.length > 0 &&
				suggestions.map(
					(suggestion) =>
						suggestion.blob && (
							<Button key={suggestion.service} disabled={disabled} square onClick={handleClick(suggestion)}>
								<Box mie={4}>
									<Avatar title={suggestion.service} url={suggestion.blob as unknown as string} />
								</Box>
							</Button>
						),
				)}
		</Margins>
	);
};

export default UserAvatarSuggestions;
