import { UpdaterImpl } from './updater';

const updater = new UpdaterImpl<{
	_id: string;
	t: 'l';
	a: {
		b: string;
	};
	c?: number;

	d?: {
		e: string;
	};
}>({} as any);

// @ts-expect-error
updater.set('njame', 1);
// @ts-expect-error
updater.set('ttes', 1);
// @ts-expect-error
updater.set('t', 'a');
updater.set('t', 'l');
// @ts-expect-error
updater.set('a', 'b');
// @ts-expect-error
updater.set('c', 'b');
updater.set('c', 1);

updater.set('a', {
	b: 'set',
});
updater.set('a.b', 'test');

// @ts-expect-error
updater.unset('a');

updater.unset('c');

updater.unset('d');

updater.unset('d.e');
