import type { TFunction } from 'i18next';

import { getMessagePreview } from './getMessagePreview';
import { normalizeMessagePreview } from './normalizeMessagePreview';
import { createFakeSubscription, createFakeMessage } from '../../../../tests/mocks/data';

jest.mock('./normalizeMessagePreview');

const mockNormalizeMessagePreview = normalizeMessagePreview as jest.MockedFunction<typeof normalizeMessagePreview>;

describe('getMessagePreview', () => {
	const mockT = jest.fn((key: string) => key) as unknown as TFunction;

	beforeEach(() => {
		jest.clearAllMocks();
		mockNormalizeMessagePreview.mockReturnValue('normalized message');
	});

	describe('when lastMessage is undefined', () => {
		it('should return translation for No_messages_yet', () => {
			const room = createFakeSubscription();
			const result = getMessagePreview(room, undefined, mockT);

			expect(result).toBe('No_messages_yet');
			expect(mockT).toHaveBeenCalledWith('No_messages_yet');
			expect(mockNormalizeMessagePreview).not.toHaveBeenCalled();
		});
	});

	describe('when message is a video conference message', () => {
		it('should return translation for Call_started', () => {
			const room = createFakeSubscription();
			const message = createFakeMessage({ t: 'videoconf' });
			const result = getMessagePreview(room, message, mockT);

			expect(result).toBe('Call_started');
			expect(mockT).toHaveBeenCalledWith('Call_started');
			expect(mockNormalizeMessagePreview).not.toHaveBeenCalled();
		});
	});

	describe('when message is E2EE', () => {
		it('should return encrypted message preview when e2e is not done', () => {
			const room = createFakeSubscription();
			const message = createFakeMessage({ t: 'e2e', e2e: 'pending' });
			const result = getMessagePreview(room, message, mockT);

			expect(result).toBe('Encrypted_message_preview_unavailable');
			expect(mockT).toHaveBeenCalledWith('Encrypted_message_preview_unavailable');
			expect(mockNormalizeMessagePreview).not.toHaveBeenCalled();
		});

		it('should proceed to normalization when e2e is done', () => {
			const room = createFakeSubscription();
			const message = createFakeMessage({ t: 'e2e', e2e: 'done', u: { _id: 'user-id', username: 'testuser', name: 'Test User' } });
			mockNormalizeMessagePreview.mockReturnValue('decrypted message');

			const result = getMessagePreview(room, message, mockT);

			expect(result).toBe('Test User: decrypted message');
			expect(mockNormalizeMessagePreview).toHaveBeenCalledWith(message, mockT);
		});
	});

	describe('when message has no user', () => {
		it('should return normalized message directly', () => {
			const room = createFakeSubscription();
			const message = createFakeMessage({ u: undefined });
			mockNormalizeMessagePreview.mockReturnValue('normalized message');

			const result = getMessagePreview(room, message, mockT);

			expect(result).toBe('normalized message');
			expect(mockNormalizeMessagePreview).toHaveBeenCalledWith(message, mockT);
		});
	});

	describe('when message is from current user', () => {
		it('should return "You: normalized message" when usernames match', () => {
			const room = createFakeSubscription({ u: { _id: 'user-id', username: 'testuser', name: 'Test User' } });
			const message = createFakeMessage({ u: { _id: 'user-id', username: 'testuser', name: 'Test User' } });
			mockNormalizeMessagePreview.mockReturnValue('my message');

			const result = getMessagePreview(room, message, mockT);

			expect(result).toBe('You: my message');
			expect(mockT).toHaveBeenCalledWith('You');
			expect(mockNormalizeMessagePreview).toHaveBeenCalledWith(message, mockT);
		});
	});

	describe('when room is a direct message room', () => {
		it('should return normalized message without sender name for single DM', () => {
			const room = createFakeSubscription({
				t: 'd',
				uids: ['user1', 'user2'],
			});
			const message = createFakeMessage({
				u: { _id: 'other-user-id', username: 'otheruser', name: 'Other User' },
			});
			mockNormalizeMessagePreview.mockReturnValue('direct message');

			const result = getMessagePreview(room, message, mockT);

			expect(result).toBe('direct message');
			expect(mockNormalizeMessagePreview).toHaveBeenCalledWith(message, mockT);
		});

		it('should return sender name and message for multiple DM', () => {
			const room = createFakeSubscription({
				t: 'd',
				uids: ['user1', 'user2', 'user3'],
			});
			const message = createFakeMessage({
				u: { _id: 'other-user-id', username: 'otheruser', name: 'Other User' },
			});
			mockNormalizeMessagePreview.mockReturnValue('group message');

			const result = getMessagePreview(room, message, mockT);

			expect(result).toBe('Other User: group message');
			expect(mockNormalizeMessagePreview).toHaveBeenCalledWith(message, mockT);
		});
	});

	describe('when room is a group or channel', () => {
		it('should return sender name and message when user has name', () => {
			const room = createFakeSubscription({ t: 'c' });
			const message = createFakeMessage({
				u: { _id: 'other-user-id', username: 'otheruser', name: 'Other User' },
			});
			mockNormalizeMessagePreview.mockReturnValue('channel message');

			const result = getMessagePreview(room, message, mockT);

			expect(result).toBe('Other User: channel message');
			expect(mockNormalizeMessagePreview).toHaveBeenCalledWith(message, mockT);
		});

		it('should return username and message when user has no name', () => {
			const room = createFakeSubscription({ t: 'p' });
			const message = createFakeMessage({
				u: { _id: 'other-user-id', username: 'otheruser' },
			});
			mockNormalizeMessagePreview.mockReturnValue('private message');

			const result = getMessagePreview(room, message, mockT);

			expect(result).toBe('otheruser: private message');
			expect(mockNormalizeMessagePreview).toHaveBeenCalledWith(message, mockT);
		});
	});

	describe('when message has no preview', () => {
		it('should return empty string', () => {
			const room = createFakeSubscription();
			const message = createFakeMessage();
			mockNormalizeMessagePreview.mockReturnValue(undefined);

			const result = getMessagePreview(room, message, mockT);

			expect(result).toBe('');
			expect(mockNormalizeMessagePreview).toHaveBeenCalledWith(message, mockT);
		});
	});
});
