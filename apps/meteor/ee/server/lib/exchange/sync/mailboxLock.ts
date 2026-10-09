import type { IUser } from '@rocket.chat/core-typings';

const held = new Map<string, { settled: Promise<void>; finish: () => void }>();

export const acquireMailbox = (scope: 'calendar' | 'contacts', uid: IUser['_id']): (() => void) | undefined => {
	const key = `${scope}:${uid}`;

	if (held.has(key)) {
		return undefined;
	}

	let finish!: () => void;
	const settled = new Promise<void>((resolve) => {
		finish = resolve;
	});

	held.set(key, { settled, finish });

	return () => {
		held.delete(key);
		finish();
	};
};

/** Settles once every sync holding a mailbox has let go, so a caller about to delete what they write does not race them. */
export const whenMailboxesIdle = (): Promise<unknown> => Promise.all([...held.values()].map(({ settled }) => settled));
