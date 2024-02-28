import type { IMessage, MessageAttachment } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import {
	hasTranslationLanguageInAttachments,
	hasTranslationLanguageInMessage,
} from '../../../../../../../client/views/room/MessageList/lib/autoTranslate';

describe('autoTranslate', () => {
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
				expect(result).to.be.equal(expectedResult);
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
				expect(result).to.be.equal(expectedResult);
			});
		});
	});
});
