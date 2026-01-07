import { Box, TextInput, Throbber } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { forwardRef, useState, memo } from 'react';
import type { Components } from 'react-virtuoso';
import { useTranslation } from 'react-i18next';

import { useSmartSearch } from '../hooks/useSmartSearch';
import TeamCollabFilters from './TeamCollabFilters';

const RoomListFilters: Components['Header'] = forwardRef(function RoomListFilters(_, ref) {
	const { t } = useTranslation();
	const [filterText, setFilterText] = useState('');
	
	const getRooms = useEndpoint('GET', '/v1/rooms.get');

	const searchProvider = useMutableCallback(async (query: string, signal: AbortSignal) => {
		return await getRooms({ filter: query }, { signal });
	});

	const { search, loading } = useSmartSearch(searchProvider, 400);

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