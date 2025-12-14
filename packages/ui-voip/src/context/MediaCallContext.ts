import type { UserStatus } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { Device } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createContext, useContext, useState } from 'react';

import type { PeerAutocompleteOptions } from '../components';

type InternalPeerInfo = {
	displayName: string;
	userId: string;
	username?: string;
	avatarUrl?: string;
	callerId?: string;
	status?: UserStatus;
};

type ExternalPeerInfo = {
	number: string;
};

export type ConnectionState = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING';

export type PeerInfo = InternalPeerInfo | ExternalPeerInfo;

export type State = 'closed' | 'new' | 'calling' | 'ringing' | 'ongoing';

type MediaCallContextType = {
	state: State;
	connectionState: ConnectionState;

	peerInfo: PeerInfo | undefined;
	transferredBy: string | undefined;

	hidden: boolean;

	muted: boolean;
	held: boolean;

	remoteMuted: boolean;
	remoteHeld: boolean;

	onMute: () => void;
	onHold: () => void;

	onDeviceChange: (device: Device) => void;
	onForward: () => void;
	onTone: (tone: string) => void;

	onEndCall: () => void;

	onCall: () => Promise<void>;
	onAccept: () => Promise<void>;

	onToggleWidget: (peerInfo?: PeerInfo) => void;

	onSelectPeer: (peerInfo: PeerInfo) => void;

	getAutocompleteOptions: (filter: string) => Promise<PeerAutocompleteOptions[]>;
	// This is used to get the peer info from the server in case it's not available in the autocomplete options.
	getPeerInfo: (id: string) => Promise<PeerInfo | undefined>;
};

export const defaultMediaCallContextValue: MediaCallContextType = {
	state: 'closed',
	connectionState: 'CONNECTED',

	peerInfo: undefined,
	transferredBy: undefined,

	hidden: false,

	muted: false,
	held: false,
	remoteMuted: false,
	remoteHeld: false,

	onMute: () => undefined,
	onHold: () => undefined,

	onDeviceChange: () => undefined,
	onForward: () => undefined,
	onTone: () => undefined,

	onEndCall: () => undefined,
	onCall: () => Promise.resolve(undefined),
	onAccept: () => Promise.resolve(undefined),

	onToggleWidget: () => undefined,

	onSelectPeer: () => undefined,

	getAutocompleteOptions: () => Promise.resolve([]),
	getPeerInfo: () => Promise.resolve(undefined),
};

type MediaCallExternalContextType = {
	state: State;
	onToggleWidget: (peerInfo?: PeerInfo) => void;
	onEndCall: () => void;
	peerInfo: PeerInfo | undefined;
};

type MediaCallUnauthorizedContextType = {
	state: 'unauthorized';
	onToggleWidget: undefined;
	onEndCall: undefined;
	peerInfo: undefined;
};

type MediaCallUnlicensedContextType = {
	state: 'unlicensed';
	onToggleWidget: (peerInfo?: any) => void;
	onEndCall: undefined;
	peerInfo: undefined;
};

const MediaCallContext = createContext<MediaCallContextType | MediaCallUnauthorizedContextType | MediaCallUnlicensedContextType>(
	defaultMediaCallContextValue,
);

// This hook is for internal use only. It will only be available if the user has the necessary permissions and the workspace has the necessary modules.
export const useMediaCallContext = (): MediaCallContextType => {
	const context = useContext(MediaCallContext);
	if (context.state === 'unauthorized') {
		throw new Error('MediaCallContext is unauthorized');
	}
	if (context.state === 'unlicensed') {
		throw new Error('MediaCallContext is unlicensed');
	}
	return context;
};

// This hook is for other modules/packages, and exposes the necessary properties to interact with the context.
export const useMediaCallExternalContext = ():
	| MediaCallExternalContextType
	| MediaCallUnauthorizedContextType
	| MediaCallUnlicensedContextType => {
	const context = useContext(MediaCallContext);

	if (context.state === 'unauthorized' || context.state === 'unlicensed') {
		return context;
	}

	return { state: context.state, onToggleWidget: context.onToggleWidget, onEndCall: context.onEndCall, peerInfo: context.peerInfo };
};

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
				status: localInfo.status as UserStatus,
			});
		},
		value: peerInfo && 'userId' in peerInfo ? peerInfo.userId : undefined,
		filter,
		onKeypadPress: (key: string) => setFilter((filter) => filter + key),
	};
};

export default MediaCallContext;
