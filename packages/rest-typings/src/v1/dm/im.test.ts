import assert from 'node:assert';
import { describe, it } from 'node:test';

import type { DmEndpoints } from './dm';
import type { ImEndpoints } from './im';

describe('im / dm endpoint typings', () => {
	it('should accept valid arguments at compile time', () => {
		type OthersIm = ImEndpoints['/v1/im.messages.others']['GET'];
		type OthersDm = DmEndpoints['/v1/dm.messages.others']['GET'];
		type ListIm = ImEndpoints['/v1/im.list']['GET'];
		type ListDm = DmEndpoints['/v1/dm.list']['GET'];
		type ListEveryoneIm = ImEndpoints['/v1/im.list.everyone']['GET'];
		type ListEveryoneDm = DmEndpoints['/v1/dm.list.everyone']['GET'];

		let others!: OthersIm;
		let othersDm!: OthersDm;
		let list!: ListIm;
		let listDm!: ListDm;
		let everyone!: ListEveryoneIm;
		let everyoneDm!: ListEveryoneDm;

		// These must compile cleanly
		if (false as boolean) {
			others({ roomId: 'room-id' });
			othersDm({ roomId: 'room-id' });
			list();
			list({ count: 20, offset: 0 });
			listDm();
			listDm({ count: 20, offset: 0 });
			everyone();
			everyone({ count: 20, offset: 0 });
			everyoneDm();
			everyoneDm({ count: 20, offset: 0 });

			// @ts-expect-error roomId is required
			others();
			// @ts-expect-error roomId is required
			othersDm();
		}

		assert.equal(true, true);
	});
});
