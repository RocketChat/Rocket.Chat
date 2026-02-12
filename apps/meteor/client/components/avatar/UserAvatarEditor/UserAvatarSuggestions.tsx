import { Button, Avatar } from '@rocket.chat/fuselage';
import { useCallback, memo } from 'react';

import type { UserAvatarSuggestion } from './UserAvatarSuggestion';
import { useUserAvatarSuggestions } from './useUserAvatarSuggestions';

type UserAvatarSuggestionsProps = {
	disabled?: boolean;
	onSelectOne?: (suggestion: UserAvatarSuggestion) => void;
};

// Memoized to prevent re-renders when parent updates but props haven't changed
const UserAvatarSuggestions = memo(function UserAvatarSuggestions({ disabled, onSelectOne }: UserAvatarSuggestionsProps) {
	const { data } = useUserAvatarSuggestions();
	const suggestions = (data ?? []) as UserAvatarSuggestion[];

	const handleClick = useCallback((suggestion: UserAvatarSuggestion) => () => onSelectOne?.(suggestion), [onSelectOne]);

	return (
		<>
			{suggestions.map(
				(suggestion) =>
					suggestion.blob && (
						<Button key={suggestion.service} square disabled={disabled} mi={4} onClick={handleClick(suggestion)}>
							<Avatar title={suggestion.service} url={suggestion.blob} />
						</Button>
					),
			)}
		</>
	);
});

export default UserAvatarSuggestions;
