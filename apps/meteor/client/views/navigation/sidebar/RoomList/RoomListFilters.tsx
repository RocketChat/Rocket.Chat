import { Box, TextInput, Throbber } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { forwardRef, useState, memo } from 'react';
import type { Components } from 'react-virtuoso';
import { useTranslation } from 'react-i18next';

import { useSmartSearch } from '../../../../hooks/useSmartSearch';
import TeamCollabFilters from './TeamCollabFilters';

const RoomListFilters: Components['Header'] = forwardRef(function RoomListFilters(_, ref) {
	const { t } = useTranslation();
	const [filterText, setFilterText] = useState('');
	
	// FIX: Use the correct autocomplete endpoint for searching
	const getRoomsAutocomplete = useEndpoint('GET', '/v1/rooms.autocomplete.channelAndPrivate');

	const searchProvider = useMutableCallback(async (query: string, signal: AbortSignal) => {
		const response = await getRoomsAutocomplete({ query }, { signal });
		return response.items;
	});

	// FIX: Destructure results. In a full implementation, these results would 
	// be passed to a Context or State provider so the RoomList can see them.
	const { results, search, loading } = useSmartSearch(searchProvider, 400);

	const handleChange = useMutableCallback((e) => {
		const { value } = e.currentTarget;
		setFilterText(value);
		search(value);
	});

	return (
		<Box ref={ref} display='flex' flexDirection='column' bg='surface-light'>
			<Box p='x16'>
				<TextInput 
					placeholder={t('Search')} 
					value={filterText} 
					onChange={handleChange}
					addon={loading ? <Throbber size='x12' /> : null}
				/>
			</Box>
			<TeamCollabFilters />
		</Box>
	);
});

export default memo(RoomListFilters);
