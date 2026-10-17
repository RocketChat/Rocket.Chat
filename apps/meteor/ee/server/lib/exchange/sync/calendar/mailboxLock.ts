import type { IUser } from '@rocket.chat/core-typings';

const held = new Map<IUser['_id'], { settled: Promise<void>; finish: () => void }>();

export const acquireMailbox = (uid: IUser['_id']): (() => void) | undefined => {
	if (held.has(uid)) {
		return undefined;
	}

	let finish!: () => void;
	const settled = new Promise<void>((resolve) => {
		finish = resolve;
	});

	held.set(uid, { settled, finish });

	return () => {
		held.delete(uid);
		finish();
	};
};

/** Settles once every sync holding a mailbox has let go, so a caller about to delete what they write does not race them. */
export const whenMailboxesIdle = (): Promise<unknown> => Promise.all([...held.values()].map(({ settled }) => settled));
