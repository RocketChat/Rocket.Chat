import type { IRoom, ISecurityLabel } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

const selections = new Map<IRoom['_id'], ISecurityLabel>();
const emitter = new Emitter<{ change: IRoom['_id'] }>();

/**
 * The label the user picked for their next messages in each room; rooms without a pick use the room default.
 */
export const selectedSecurityLabels = {
	get: (rid: IRoom['_id']): ISecurityLabel | undefined => selections.get(rid),
	set: (rid: IRoom['_id'], label: ISecurityLabel): void => {
		selections.set(rid, label);
		emitter.emit('change', rid);
	},
	subscribe: (callback: () => void): (() => void) => emitter.on('change', callback),
};
