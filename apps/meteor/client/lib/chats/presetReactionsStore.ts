import type { IRoom } from '@rocket.chat/core-typings';

type PresetReaction = {
	emoji: string;
	label?: string;
};

const presetReactionsStore = new Map<IRoom['_id'], PresetReaction[]>();

export const setPresetReactions = (rid: IRoom['_id'], reactions: PresetReaction[]): void => {
	if (reactions.length === 0) {
		presetReactionsStore.delete(rid);
	} else {
		presetReactionsStore.set(rid, reactions);
	}
};

export const getPresetReactions = (rid: IRoom['_id']): PresetReaction[] => {
	return presetReactionsStore.get(rid) || [];
};

export const clearPresetReactions = (rid: IRoom['_id']): void => {
	presetReactionsStore.delete(rid);
};
