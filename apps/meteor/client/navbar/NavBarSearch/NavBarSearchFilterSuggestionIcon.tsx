import type { SearchFilterSuggestion } from '@rocket.chat/ai-search';
import { Icon } from '@rocket.chat/fuselage';
import { useUserRoom } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import { RoomIcon } from '../../components/RoomIcon';

export type NavBarSearchFilterSuggestionIconProps = {
	suggestion: SearchFilterSuggestion;
};

const NavBarSearchFilterSuggestionIcon = ({ suggestion }: NavBarSearchFilterSuggestionIconProps): ReactElement => {
	const room = useUserRoom(suggestion.meta?.rid ?? '');

	if (room) {
		return <RoomIcon room={room} size='x16' />;
	}

	return <Icon name={suggestion.icon} size='x16' />;
};

export default NavBarSearchFilterSuggestionIcon;
