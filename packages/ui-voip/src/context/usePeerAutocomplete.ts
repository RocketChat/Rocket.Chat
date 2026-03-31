import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useUserPresence } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import type { PeerInfo } from './MediaCallContext';
import { useMediaCallContext } from './MediaCallContext';
import type { PeerAutocompleteOptions } from '../components';
import { mediaCallQueryKeys } from '../utils/queryKeys';

const PREFIX_FIRST_OPTION = 'rcx-first-option-';

export const isFirstPeerAutocompleteOption = (value: string) => {
	return value.startsWith(PREFIX_FIRST_OPTION);
};

const getFirstOption = (filter: string): PeerAutocompleteOptions => {
	return { value: `${PREFIX_FIRST_OPTION}${filter}`, label: filter, avatarUrl: '' };
};

export const usePeerAutocomplete = (onSelectPeer: (peerInfo: PeerInfo) => void, peerInfo: PeerInfo | undefined) => {
	const { getAutocompleteOptions } = useMediaCallContext();
	const [filter, setFilter] = useState('');

	const debouncedFilter = useDebouncedValue(filter, 400);

	const { data: options } = useQuery({
		queryKey: mediaCallQueryKeys.peerAutocomplete(debouncedFilter),
		queryFn: async () => {
			const options = await getAutocompleteOptions(debouncedFilter);

			if (debouncedFilter.length > 0) {
				return [getFirstOption(debouncedFilter), ...options];
			}

			return options;
		},
		placeholderData: keepPreviousData,
		initialData: [],
	});

	const status = useUserPresence(peerInfo && 'userId' in peerInfo ? peerInfo.userId : undefined);

	useEffect(() => {
		if (!peerInfo || !('status' in peerInfo) || !status?.status) {
			return;
		}

		if (status.status === peerInfo?.status) {
			return;
		}

		onSelectPeer({
			...peerInfo,
			status: status.status,
		});
	}, [status, peerInfo, onSelectPeer]);

	return {
		options,
		onChangeFilter: setFilter,
		onChangeValue: (value: string | string[]) => {
			if (Array.isArray(value)) {
				return;
			}

			if (isFirstPeerAutocompleteOption(value)) {
				onSelectPeer({ number: value.replace(PREFIX_FIRST_OPTION, '') });
				return;
			}

			const localInfo = options.find((option) => option.value === value);

			if (!localInfo) {
				throw new Error(`Peer info not found for value: ${value}`);
			}

			onSelectPeer({
				userId: localInfo.value,
				displayName: localInfo.label,
				avatarUrl: localInfo.avatarUrl,
				status: localInfo.status,
			});
		},
		value: peerInfo && 'userId' in peerInfo ? peerInfo.userId : undefined,
		filter,
		onKeypadPress: (key: string) => setFilter((filter) => filter + key),
	};
};
