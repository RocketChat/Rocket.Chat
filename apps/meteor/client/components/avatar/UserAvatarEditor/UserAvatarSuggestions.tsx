import { Button, Avatar } from '@rocket.chat/fuselage';
import { useCallback } from 'react';

import type { UserAvatarSuggestion } from './UserAvatarSuggestion';
import { useUserAvatarSuggestions } from './useUserAvatarSuggestions';

export type UserAvatarSuggestionsProps = {
	disabled?: boolean;
	onSelectOne?: (suggestion: UserAvatarSuggestion) => void;
};

function UserAvatarSuggestions({ disabled, onSelectOne }: UserAvatarSuggestionsProps) {
	const { data: suggestions = [] } = useUserAvatarSuggestions();

	const handleClick = useCallback((suggestion: UserAvatarSuggestion) => () => onSelectOne?.(suggestion), [onSelectOne]);

	return (
		<>
			{suggestions.map(
				(suggestion) =>
					suggestion.blob && (
						<Button key={suggestion.service} square disabled={disabled} marginInline={4} onClick={handleClick(suggestion)}>
							<Avatar title={suggestion.service} url={suggestion.blob} />
						</Button>
					),
			)}
		</>
	);
}

export default UserAvatarSuggestions;
