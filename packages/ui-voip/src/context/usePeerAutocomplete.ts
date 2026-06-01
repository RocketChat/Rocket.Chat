import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useUserPresence } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import type { PeerInfo } from './definitions';
import type { PeerAutocompleteOptions } from '../components';
import { useMediaCallInstance } from './MediaCallInstanceContext';
import { mediaCallQueryKeys } from '../utils/queryKeys';

const PREFIX_FIRST_OPTION = 'rcx-first-option-';

export const isFirstPeerAutocompleteOption = (value: string) => {
	return value.startsWith(PREFIX_FIRST_OPTION);
};

const getFirstOption = (filter: string): PeerAutocompleteOptions => {
	return { value: `${PREFIX_FIRST_OPTION}${filter}`, label: filter, avatarUrl: '' };
};

export const usePeerAutocomplete = (onSelectPeer: (peerInfo: PeerInfo) => void, peerInfo: PeerInfo | undefined) => {
	const { getAutocompleteOptions } = useMediaCallInstance();
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

	// Reflect an externally-selected phone number (e.g. forwarded from a `tel:`/`callto:` deeplink
	// by the Desktop app) in the visible input. `value` is derived from `userId` only, so a peer
	// set as `{ number }` would otherwise leave the field empty. Fires on `peerInfo` identity change
	// only, so manual typing is preserved and re-selecting the same number is a no-op.
	useEffect(() => {
		if (peerInfo && 'number' in peerInfo) {
			setFilter(peerInfo.number);
		}
	}, [peerInfo]);

	// When the dial-pad holds a phone-number peer (e.g. pre-filled from a deeplink), keep the
	// selected peer in sync with manual edits so the call dials the number the user actually sees,
	// not the original one. Status-based peers (`userId`) keep their existing selection.
	const updateNumberFilter = (next: string) => {
		setFilter(next);
		if (peerInfo && 'number' in peerInfo) {
			onSelectPeer({ number: next });
		}
	};

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
		onChangeFilter: updateNumberFilter,
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
		onKeypadPress: (key: string) => updateNumberFilter(filter + key),
	};
};
