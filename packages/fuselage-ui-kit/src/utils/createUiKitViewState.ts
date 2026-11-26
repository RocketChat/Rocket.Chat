import type * as UiKit from '@rocket.chat/ui-kit';

import { extractInitialStateFromLayout } from './extractInitialStateFromLayout';
import type { Value } from './getInitialValue';

/** What `viewSubmit` and `viewClosed` carry: `{ [blockId]: { [actionId]: value } }`. */
export type UiKitViewStateSnapshot = { [blockId: string]: { [actionId: string]: unknown } };

/** The form state of one view: the value of each element and the uploads still in flight. */
export type UiKitViewState = {
	getState: () => UiKitViewStateSnapshot;
	isUploading: () => boolean;
	subscribe: (listener: () => void) => () => void;
	getValue: (actionId: string) => Value | undefined;
	setValue: (actionId: string, value: Value) => void;
	setUploading: (actionId: string, uploading: boolean) => void;
	reseed: (blocks: UiKit.LayoutBlock[]) => void;
};

type Values = { [actionId: string]: Value };

// When the app replaces the blocks, an element that stays keeps what the user entered.
const reseedValues = (values: Values, blocks: UiKit.LayoutBlock[], rid: string | undefined): Values =>
	Object.fromEntries(
		Object.entries(extractInitialStateFromLayout(blocks, rid)).map(([actionId, seeded]) => {
			const current = values[actionId];
			if (!current) {
				return [actionId, seeded];
			}

			const blockId = seeded.blockId ?? current.blockId;
			return [actionId, blockId === current.blockId ? current : { value: current.value, blockId }];
		}),
	);

/** `rid` is the room the view was opened from, for the elements that default to the current conversation. */
export const createUiKitViewState = (blocks: UiKit.LayoutBlock[], rid?: string): UiKitViewState => {
	let values: Values = extractInitialStateFromLayout(blocks, rid);
	let uploading: ReadonlySet<string> = new Set();
	const listeners = new Set<() => void>();

	const notify = () => listeners.forEach((listener) => listener());

	return {
		getState: () =>
			Object.entries(values).reduce<UiKitViewStateSnapshot>((state, [actionId, { value, blockId }]) => {
				if (!blockId) {
					return state;
				}

				state[blockId] = state[blockId] || {};
				state[blockId][actionId] = value;
				return state;
			}, {}),
		isUploading: () => uploading.size > 0,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		getValue: (actionId) => values[actionId],
		setValue: (actionId, value) => {
			values = { ...values, [actionId]: value };
			notify();
		},
		setUploading: (actionId, isUploading) => {
			if (uploading.has(actionId) === isUploading) {
				return;
			}

			const next = new Set(uploading);
			if (isUploading) {
				next.add(actionId);
			} else {
				next.delete(actionId);
			}
			uploading = next;
			notify();
		},
		reseed: (blocks) => {
			values = reseedValues(values, blocks, rid);
			notify();
		},
	};
};
