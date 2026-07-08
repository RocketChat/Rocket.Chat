import type { IAppsUser } from '@rocket.chat/apps';
import type { ISetting, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { AppSettingsConverter } from '../../../../../app/apps/server/converters/settings';
import { AppUsersConverter } from '../../../../../app/apps/server/converters/users';

/*
 * Regression coverage for the lenient enum handling. The codecs must reproduce the pre-migration
 * behaviour of the `_convert*` switch helpers, which never validated their input: `undefined`/`null`
 * enum values fall back rather than throwing. A stricter Zod schema here would reject those values
 * and break real payloads (Livechat guests, rocket.cat, bots, app-created users without a status).
 */

const orch: any = {};

// The fixtures are intentionally minimal; cast to the real input types (rather than `any`) so the
// correct converter overload is selected and the result stays typed.
const asUser = (value: Record<string, unknown>) => value as unknown as IUser;
const asAppUser = (value: Record<string, unknown>) => value as unknown as IAppsUser;
const asSetting = (value: Record<string, unknown>) => value as unknown as ISetting;

describe('apps converters — lenient enum edge cases', () => {
	describe('AppUsersConverter.convertToApp', () => {
		const converter = new AppUsersConverter(orch);

		it('maps an undefined statusConnection to UNDEFINED (Livechat guests / rocket.cat)', () => {
			const result = converter.convertToApp(asUser({ _id: 'u', username: 'a', statusConnection: undefined }));

			expect(result.statusConnection).to.equal('undefined');
			expect(result.type).to.equal('unknown');
		});

		it('does not throw and falls back to OFFLINE for a null statusConnection', () => {
			const result = converter.convertToApp(asUser({ _id: 'u', username: 'a', statusConnection: null }));

			expect(result.statusConnection).to.equal('offline');
		});
	});

	describe('AppUsersConverter.convertToRocketChat', () => {
		const converter = new AppUsersConverter(orch);

		it('does not throw when the app user has no type/statusConnection and strips empties', () => {
			const result = converter.convertToRocketChat(asAppUser({ id: 'u', username: 'a' }));

			expect(result).to.deep.equal({ _id: 'u', username: 'a' });
		});
	});

	describe('AppSettingsConverter.convertToApp', () => {
		const converter = new AppSettingsConverter(orch);

		it('passes an unknown/undefined setting type through without throwing', () => {
			const result = converter.convertToApp(asSetting({ _id: 's', type: undefined }));

			expect(result.id).to.equal('s');
			expect(result.type).to.equal(undefined);
		});
	});
});
