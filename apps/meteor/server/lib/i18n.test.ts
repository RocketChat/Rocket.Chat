import { describe, it } from 'node:test';

import ptBR from '@rocket.chat/i18n/dist/resources/pt-BR.i18n.json';
import { expect } from 'chai';

import { getLanguageResourceJSON } from './i18n';

describe('getLanguageResourceJSON', () => {
	it('should serialize the translation file of a supported language', () => {
		const json = getLanguageResourceJSON('pt-BR');

		expect(json).to.be.a('string');
		expect(JSON.parse(json as string)).to.deep.equal(ptBR);
	});

	it('should return undefined for an unsupported language', () => {
		expect(getLanguageResourceJSON('xx')).to.equal(undefined);
		expect(getLanguageResourceJSON('PT-BR')).to.equal(undefined);
	});

	// The route decodes the language from the URL, so it can hold path segments.
	it('should return undefined for a language holding a path', () => {
		expect(getLanguageResourceJSON('../en')).to.equal(undefined);
		expect(getLanguageResourceJSON('../../../../package')).to.equal(undefined);
		expect(getLanguageResourceJSON('en/../en')).to.equal(undefined);
	});
});
