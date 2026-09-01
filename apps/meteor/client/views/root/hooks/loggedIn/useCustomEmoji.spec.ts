import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useCustomEmoji } from './useCustomEmoji';
import { emoji } from '../../../../lib/emoji';

jest.mock('../../../../lib/customEmoji', () => ({ customRender: jest.fn((html: string) => html) }));

const createCustomEmoji = () => ({
	_id: 'emojiId',
	_updatedAt: new Date().toISOString(),
	name: 'my-emoji',
	aliases: ['my-alias'],
	extension: 'png',
});

it('should call emoji-custom.list without a query parameter', async () => {
	const getCustomEmojis = jest.fn().mockReturnValue({ emojis: { update: [], remove: [] } });

	renderHook(() => useCustomEmoji(), {
		wrapper: mockAppRoot().withEndpoint('GET', '/v1/emoji-custom.list', getCustomEmojis).build(),
	});

	await waitFor(() => expect(getCustomEmojis).toHaveBeenCalledWith({}));
});

it('should populate emoji.packages.emojiCustom with the emojis and aliases returned by the endpoint', async () => {
	const customEmoji = createCustomEmoji();
	const dispatchUpdateSpy = jest.spyOn(emoji, 'dispatchUpdate');

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
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

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

	consoleErrorSpy.mockRestore();
});
