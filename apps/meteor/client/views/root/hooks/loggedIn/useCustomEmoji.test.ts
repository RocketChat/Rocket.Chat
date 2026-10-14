import { afterEach, beforeEach, describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';

import { emoji } from '../../../../lib/emoji';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const spyOn: ModuleMocker['spyOn'] = mocker.spyOn.bind(mocker);

const pristinePackages = { ...emoji.packages };

const { useCustomEmoji } = proxyquire.noCallThru().load<typeof import('./useCustomEmoji')>('./useCustomEmoji', {
	'../../../../lib/customEmoji': {
		customRender: fn<FunctionLike>((html: string) => html),
	},
});

const createCustomEmoji = () => ({
	_id: 'emojiId',
	_updatedAt: new Date().toISOString(),
	name: 'my-emoji',
	aliases: ['my-alias'],
	extension: 'png',
});

describe('useCustomEmoji', () => {
	beforeEach(() => {
		emoji.list = {};
		emoji.packages = { ...pristinePackages };
	});

	afterEach(() => {
		mocker.restoreAllMocks();
	});

	it('should call emoji-custom.list without a query parameter', async () => {
		const getCustomEmojis = fn<FunctionLike>().mockReturnValue({ emojis: { update: [], remove: [] } });

		renderHook(() => useCustomEmoji(), {
			wrapper: mockAppRoot().withEndpoint('GET', '/v1/emoji-custom.list', getCustomEmojis).build(),
		});

		await waitFor(() => expect(getCustomEmojis).toHaveBeenCalledWith({}));
	});

	it('should populate emoji.packages.emojiCustom with the emojis and aliases returned by the endpoint', async () => {
		const customEmoji = createCustomEmoji();
		const dispatchUpdateSpy = spyOn(emoji, 'dispatchUpdate');

		renderHook(() => useCustomEmoji(), {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/emoji-custom.list', () => ({ emojis: { update: [customEmoji], remove: [] } }))
				.build(),
		});

		await waitFor(() => expect(emoji.packages.emojiCustom.emojisByCategory.rocket).toContain('my-emoji'));

		expect(emoji.packages.emojiCustom.list).toEqual(expect.arrayContaining([':my-emoji:', ':my-alias:']));
		expect(emoji.list[':my-emoji:']).toMatchObject({ name: 'my-emoji', emojiPackage: 'emojiCustom' });
		expect(emoji.list[':my-alias:']).toEqual({ emojiPackage: 'emojiCustom', aliasOf: 'my-emoji' });
		expect(dispatchUpdateSpy).toHaveBeenCalled();
	});

	it('should reset emoji.packages.emojiCustom to an empty list when the request fails', async () => {
		const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => undefined);

		renderHook(() => useCustomEmoji(), {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/emoji-custom.list', () => {
					throw new Error('unexpected error');
				})
				.build(),
		});

		await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting custom emoji ', expect.any(Error)));

		expect(emoji.packages.emojiCustom.list).toEqual([]);
		expect(emoji.packages.emojiCustom.emojisByCategory.rocket).toEqual([]);
	});
});
