import type { IAppsUser } from '@rocket.chat/apps';
import type { ISetting, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { AppSettingsConverter } from '../../../../../app/apps/server/converters/settings';
import { AppUsersConverter } from '../../../../../app/apps/server/converters/users';

const orch: any = {};

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

		it('falls back to the legacy utfOffset property when utcOffset is absent', () => {
			const result = converter.convertToRocketChat(asAppUser({ id: 'u', username: 'a', utfOffset: -3 }));

			expect(result).to.deep.equal({ _id: 'u', username: 'a', utcOffset: -3 });
		});

		it('prefers utcOffset over the legacy utfOffset when both are present', () => {
			const result = converter.convertToRocketChat(asAppUser({ id: 'u', username: 'a', utcOffset: 5, utfOffset: -3 }));

			expect(result).to.deep.equal({ _id: 'u', username: 'a', utcOffset: 5 });
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
