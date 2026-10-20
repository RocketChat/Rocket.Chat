import type { IVideoConferenceUser } from '@rocket.chat/core-typings';
import type { ComponentType, ReactNode } from 'react';

export type EmbeddedCallProviderProps = {
	callId: string;
	/**
	 * Everyone associated with the call and where each of them stands, kept current as it changes. In a federated
	 * call it also says where each member publishes their media, and as whom.
	 */
	members: IVideoConferenceUser[];
	/** Whether to be in the call. The provider is mounted before the join, so this flips while its tree stays put. */
	connect: boolean;
	/** How the preflight left the devices, read as the call connects. */
	preferences?: { mic?: boolean; cam?: boolean; micId?: string; camId?: string; speakerId?: string };
	/** The call ended for this user, whoever ended it. */
	onEnded: () => void;
	children: ReactNode;
};

/**
 * Runs a video conference provider's call inside the conference window: it wraps the window and provides the
 * `@rocket.chat/ui-conference` call contexts the window's call parts read.
 */
export type EmbeddedCallProvider = ComponentType<EmbeddedCallProviderProps>;

const providers = new Map<string, EmbeddedCallProvider>();

export const embeddedCallProviders = {
	register: (providerName: string, provider: EmbeddedCallProvider): void => {
		providers.set(providerName, provider);
	},
	get: (providerName: string): EmbeddedCallProvider | undefined => providers.get(providerName),
};
