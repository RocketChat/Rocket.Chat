import { AutoCompleteProps } from '@rocket.chat/fuselage';
import { useMemo } from 'react';

import { useEndpointData } from '../../hooks/useEndpointData';

type AutocompleteData = [AutoCompleteProps['options'], { [key: string]: string | undefined }];

export const useUsersAutoComplete = (term: string, handleById: boolean): AutocompleteData => {
	const params = useMemo(
		() => ({
			selector: JSON.stringify({ term }),
		}),
		[term],
	);
	const { value: data } = useEndpointData('users.autocomplete', params);

	const options = useMemo(
		() =>
			data?.items.map((user) => ({
				value: handleById ? user._id : user.username ?? '',
				label: user.name ?? '',
			})) || [],
		[data, handleById],
	);

	const labelData = useMemo(
		() =>
			Object.fromEntries(
				data?.items.map((user) =>
					handleById ? [user._id, user.username] : [user.username, user.username],
				) || [],
			),
		[data, handleById],
	);

	return [options, labelData];
};
