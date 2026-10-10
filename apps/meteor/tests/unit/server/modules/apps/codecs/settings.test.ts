import { describe, it } from 'node:test';

import { expect } from 'chai';
import * as z from 'zod';

import { SettingCodec } from '../../../../../../server/modules/apps/converters/codecs/settings';

describe('SettingCodec', () => {
	it('refuses to convert an Apps-Engine setting back into a Rocket.Chat setting', () => {
		expect(() => z.encode(SettingCodec, { id: 'Some_Setting', type: 'int', value: 42 } as any)).to.throw(
			'converting an Apps-Engine setting back to a Rocket.Chat setting is not supported',
		);
	});
});
