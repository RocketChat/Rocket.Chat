import type { IMessage, MessageAttachment } from '@rocket.chat/core-typings';

import { hasTranslationLanguageInAttachments, hasTranslationLanguageInMessage } from './autoTranslate';

describe('hasTranslationLanguageInMessage', () => {
	const testCases = [
		[{}, '', false],
		[{ translations: { en: 'bah' } }, '', false],
		[{ translations: { en: 'bah' } }, 'pt', false],
		[{ translations: { en: 'bah' } }, 'en', true],
	] as const;

	testCases.forEach(([message, language, expectedResult]) => {
		it(`should return ${JSON.stringify(expectedResult)} for ${JSON.stringify(message)} with ${JSON.stringify(language)}`, () => {
			const result = hasTranslationLanguageInMessage(message as unknown as IMessage, language);
			expect(result).toBe(expectedResult);
		});
	});
});

describe('hasTranslationLanguageInAttachments', () => {
	const testCases = [
		[[{}], '', false],
		[undefined, '', false],
		[[{ translations: { en: 'bah' } }], '', false],
		[[{ translations: { en: 'bah' } }], 'pt', false],
		[[{ translations: { en: 'bah' } }], 'pt', false],
		[[{ translations: { en: 'bah' } }], 'en', true],
	] as const;

	testCases.forEach(([attachment, language, expectedResult]) => {
		it(`should return ${JSON.stringify(expectedResult)} for ${JSON.stringify(attachment)} with ${JSON.stringify(language)}`, () => {
			const result = hasTranslationLanguageInAttachments(attachment as unknown as MessageAttachment[], language);
			expect(result).toBe(expectedResult);
		});
	});
});
