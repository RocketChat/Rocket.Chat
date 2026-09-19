import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as z from 'zod';

import { SettingCodec } from '../../../../../../app/apps/server/converters/codecs/settings';

describe('SettingCodec', () => {
	it('refuses to convert an Apps-Engine setting back into a Rocket.Chat setting', () => {
		expect(() => z.encode(SettingCodec, { id: 'Some_Setting', type: 'int', value: 42 } as any)).to.throw(
			'converting an Apps-Engine setting back to a Rocket.Chat setting is not supported',
		);
	});
});
