import { readFileSync } from 'fs';
import { join } from 'path';

import { parse } from './profile';

function loadFixture(relativePath: string): string {
	return readFileSync(join(__dirname, '__fixtures__', relativePath), 'utf8');
}

describe('Profile.parse', () => {
	describe('theSeanCook profile', () => {
		const profile = parse(loadFixture('account/theSeanCook.json'));

		it('should parse profile', () => {
			expect(profile.id).toBe('38895958');
			expect(profile.username).toBe('theSeanCook');
			expect(profile.displayName).toBe('Sean Cook');
			expect(profile.emails).toBeUndefined();
			expect(profile.photos[0].value).toBe('https://si0.twimg.com/profile_images/1751506047/dead_sexy_normal.JPG');
		});
	});

	describe('theSeanCook profile with email', () => {
		const profile = parse(loadFixture('account/theSeanCook-include_email.json'));

		it('should parse profile', () => {
			expect(profile.id).toBe('38895958');
			expect(profile.username).toBe('theSeanCook');
			expect(profile.displayName).toBe('Sean Cook');
			expect(profile.emails).toHaveLength(1);
			expect(profile.emails![0].value).toBe('theSeanCook@example.test');
			expect(profile.photos[0].value).toBe('https://si0.twimg.com/profile_images/1751506047/dead_sexy_normal.JPG');
		});
	});

	describe('rsarver profile', () => {
		const profile = parse(loadFixture('users/rsarver.json'));

		it('should parse profile', () => {
			expect(profile.id).toBe('795649');
			expect(profile.username).toBe('rsarver');
			expect(profile.displayName).toBe('Ryan Sarver');
			expect(profile.photos[0].value).toBe('https://si0.twimg.com/profile_images/1777569006/image1327396628_normal.png');
		});
	});

	describe('rsarver profile without id_str', () => {
		const profile = parse(loadFixture('users/rsarver-without-id_str.json'));

		it('should parse profile using numeric id', () => {
			expect(profile.id).toBe('795649');
			expect(profile.username).toBe('rsarver');
			expect(profile.displayName).toBe('Ryan Sarver');
			expect(profile.photos[0].value).toBe('https://si0.twimg.com/profile_images/1777569006/image1327396628_normal.png');
		});
	});
});
