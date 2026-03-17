import type { TFunction } from 'i18next';

import { normalizeMessagePreview } from './normalizeMessagePreview';
import { createFakeMessage, createFakeMessageWithAttachment } from '../../../../tests/mocks/data';

describe('normalizeMessagePreview', () => {
	const mockT = jest.fn((key: string) => key) as unknown as TFunction;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('when message has msg property', () => {
		it('should return escaped HTML filtered markdown with emoji conversion', () => {
			const message = createFakeMessage({ msg: 'Hello :smile: world' });
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('Hello 😄 world');
		});

		it('should filter markdown from message', () => {
			const message = createFakeMessage({ msg: '*bold* text' });
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('bold text');
		});

		it('should escape HTML in message', () => {
			const message = createFakeMessage({ msg: '<script>alert("xss")</script>' });
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
		});

		it('should convert emoji shortnames to unicode', () => {
			const message = createFakeMessage({ msg: 'Hello :smile: :heart:' });
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('Hello 😄 ❤');
		});

		it('should return undefined when message is empty', () => {
			const message = createFakeMessage({ msg: '' });
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBeUndefined();
		});
	});

	describe('when message has attachments', () => {
		it('should return attachment description when available', () => {
			const message = createFakeMessageWithAttachment({
				msg: '',
				attachments: [
					{
						title: 'Attachment title',
						description: 'Attachment description',
					},
				],
			});
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('Attachment description');
		});

		it('should return attachment title when description is not available', () => {
			const message = createFakeMessageWithAttachment({
				msg: '',
				attachments: [
					{
						title: 'Attachment title',
					},
				],
			});
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('Attachment title');
		});

		it('should return translation when attachment has no title or description', () => {
			const message = createFakeMessageWithAttachment({
				msg: '',
				attachments: [
					{
						type: 'file',
					},
				],
			});
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('Sent_an_attachment');
			expect(mockT).toHaveBeenCalledWith('Sent_an_attachment');
		});

		it('should find first attachment with title', () => {
			const message = createFakeMessageWithAttachment({
				msg: '',
				attachments: [
					{
						type: 'file',
					},
					{
						title: 'Second attachment title',
					},
					{
						description: 'Third attachment description',
					},
				],
			});
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('Second attachment title');
		});

		it('should find first attachment description', () => {
			const message = createFakeMessageWithAttachment({
				msg: '',
				attachments: [
					{
						type: 'file',
					},
					{
						description: 'Second attachment description',
					},
					{
						title: 'Third attachment title',
					},
				],
			});
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('Second attachment description');
		});

		it('should escape HTML in attachment description', () => {
			const message = createFakeMessageWithAttachment({
				msg: '',
				attachments: [
					{
						description: '<script>alert("xss")</script>',
					},
				],
			});
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
		});

		it('should escape HTML in attachment title', () => {
			const message = createFakeMessageWithAttachment({
				msg: '',
				attachments: [
					{
						title: '<img src="x" onerror="alert(1)">',
					},
				],
			});
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
		});
	});

	describe('when message has both msg and attachments', () => {
		it('should prioritize msg over attachments', () => {
			const message = createFakeMessage({
				msg: 'Message text',
				attachments: [
					{
						title: 'Attachment title',
						description: 'Attachment description',
					},
				],
			});
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('Message text');
		});
	});

	describe('when message has no msg and no attachments', () => {
		it('should return undefined', () => {
			const message = createFakeMessage({ msg: undefined });
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBeUndefined();
		});
	});

	describe('when message has empty attachments array', () => {
		it('should return "Sent_an_attachment"', () => {
			const message = createFakeMessage({
				msg: undefined,
				attachments: [],
			});
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('Sent_an_attachment');
			expect(mockT).toHaveBeenCalledWith('Sent_an_attachment');
		});
	});

	describe('when message has attachments but none have title or description', () => {
		it('should return translation for Sent_an_attachment', () => {
			const message = createFakeMessage({
				msg: undefined,
				attachments: [
					{
						type: 'file',
					},
					{
						type: 'file',
					},
				],
			});
			const result = normalizeMessagePreview(message, mockT);

			expect(result).toBe('Sent_an_attachment');
			expect(mockT).toHaveBeenCalledWith('Sent_an_attachment');
		});
	});
});
