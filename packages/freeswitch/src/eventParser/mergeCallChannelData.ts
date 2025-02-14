import type { IFreeSwitchEventChannel } from '@rocket.chat/core-typings';

export function mergeCallChannelData(
	channels: (IFreeSwitchEventChannel | undefined)[],
	linkedChannels?: (IFreeSwitchEventChannel | undefined)[],
): IFreeSwitchEventChannel[] {
	const groupedChannels: Record<string, IFreeSwitchEventChannel> = {};

	for (const channel of [...channels, ...(linkedChannels || [])]) {
		if (!channel) {
			continue;
		}

		const identifier = channel?.uniqueId || channel?.name;
		if (!identifier) {
			continue;
		}

		const existing = groupedChannels[identifier];

		// Only add data from linked channels if they are not yet on the list
		if (existing && linkedChannels?.includes(channel)) {
			continue;
		}

		groupedChannels[identifier] = {
			...existing,
			...channel,
			...((existing?.bridgedTo?.length || channel.bridgedTo?.length) && {
				bridgedTo: [...new Set([...(existing?.bridgedTo || []), ...(channel.bridgedTo || [])])],
			}),
			...((existing?.originatees?.length || channel.originatees?.length) && {
				originatees: [...new Set([...(existing?.originatees || []), ...(channel.originatees || [])])],
			}),
		};
	}

	return Object.values(groupedChannels);
}
