import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createContext, useContext, useState } from 'react';

import type { PeerAutocompleteOptions } from './components';

type InternalPeerInfo = {
	name: string;
	avatarUrl: string;
	identifier: string;
};

type ExternalPeerInfo = {
	number: string;
};

export type PeerInfo = InternalPeerInfo | ExternalPeerInfo;

export type State = 'closed' | 'new' | 'calling' | 'ringing' | 'ongoing';

type MediaCallContextType = {
	state: State;

	peerInfo: PeerInfo | undefined;

	muted: boolean;
	held: boolean;
	onMute: () => void;
	onHold: () => void;

	onDeviceChange: (device: string) => void;
	onForward: () => void;
	onTone: (tone: string) => void;

	// onCall and onEndCall are used to start/accept and reject/end a call
	onEndCall: () => void;
	// TODO: Not sure if we need to pass the peerId to the callback, or if it should be a state stored somewhere else in the context.
	onCall: (peerId?: string) => void;

	onToggleWidget: () => void;

	getAutocompleteOptions: (filter: string) => Promise<PeerAutocompleteOptions[]>;
	// This is used to get the peer info from the server in case it's not available in the autocomplete options.
	getPeerInfo: (id: string) => Promise<PeerInfo | undefined>;
};

const MediaCallContext = createContext<MediaCallContextType>({
	state: 'closed',

	peerInfo: undefined,

	muted: false,
	held: false,
	onMute: () => undefined,
	onHold: () => undefined,

	onDeviceChange: () => undefined,
	onForward: () => undefined,
	onTone: () => undefined,

	onEndCall: () => undefined,
	onCall: () => undefined,

	onToggleWidget: () => undefined,

	getAutocompleteOptions: () => Promise.resolve([]),
	getPeerInfo: () => Promise.resolve(undefined),
});

export const useMediaCallContext = (): MediaCallContextType => {
	return useContext(MediaCallContext);
};

const PREFIX_FIRST_OPTION = 'rcx-first-option-';

export const isFirstPeerAutocompleteOption = (value: string) => {
	return value.startsWith(PREFIX_FIRST_OPTION);
};

const getFirstOption = (filter: string): PeerAutocompleteOptions => {
	return { value: `${PREFIX_FIRST_OPTION}${filter}`, label: filter, avatarUrl: '' };
};

export const usePeerAutocomplete = () => {
	const { getAutocompleteOptions, getPeerInfo } = useMediaCallContext();
	const [selected, setSelected] = useState<string | undefined>();
	const [filter, setFilter] = useState('');

	const debouncedFilter = useDebouncedValue(filter, 400);

	const { data: options } = useQuery({
		queryKey: ['mediaCall/peerAutocomplete', debouncedFilter],
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

	const { data: peerInfo } = useQuery({
		queryKey: ['mediaCall/peerInfo', selected],
		queryFn: async () => {
			if (!selected) {
				return undefined;
			}

			const localInfo = options.find((option) => option.value === selected);

			if (localInfo) {
				return {
					name: localInfo.label,
					avatarUrl: localInfo.avatarUrl || '',
					identifier: localInfo.value,
				};
			}

			const peerInfo = await getPeerInfo(selected);

			return peerInfo;
		},
		enabled: !!selected,
	});

	return {
		options,
		peerInfo,
		onChangeFilter: setFilter,
		onChangeValue: (value: string | string[]) => {
			if (Array.isArray(value)) {
				return;
			}

			setSelected(value);
		},
		value: selected,
		filter,
		onKeypadPress: (key: string) => setFilter((filter) => filter + key),
	};
};

export default MediaCallContext;
