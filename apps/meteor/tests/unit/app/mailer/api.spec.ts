import { expect } from 'chai';

import { replaceVariables } from '../../../../app/mailer/server/replaceVariables';

describe('Mailer-API', function () {
	describe('replaceVariables', () => {
		const i18n: {
			[key: string]: string;
		} = {
			key: 'value',
		};

		describe('single key', function functionName() {
			it(`should be equal to test ${i18n.key}`, () => {
				expect(`test ${i18n.key}`).to.be.equal(replaceVariables('test {key}', (_match, key) => i18n[key]));
			});
		});

		describe('multiple keys', function functionName() {
			it(`should be equal to test ${i18n.key} and ${i18n.key}`, () => {
				expect(`test ${i18n.key} and ${i18n.key}`).to.be.equal(replaceVariables('test {key} and {key}', (_match, key) => i18n[key]));
			});
		});

		describe('key with a trailing space', function functionName() {
			it(`should be equal to test ${i18n.key}`, () => {
				expect(`test ${i18n.key}`).to.be.equal(replaceVariables('test {key }', (_match, key) => i18n[key]));
			});
		});

		describe('key with a leading space', function functionName() {
			it(`should be equal to test ${i18n.key}`, () => {
				expect(`test ${i18n.key}`).to.be.equal(replaceVariables('test { key}', (_match, key) => i18n[key]));
			});
		});

		describe('key with leading and trailing spaces', function functionName() {
			it(`should be equal to test ${i18n.key}`, () => {
				expect(`test ${i18n.key}`).to.be.equal(replaceVariables('test { key }', (_match, key) => i18n[key]));
			});
		});

		describe('key with multiple words', function functionName() {
			it(`should be equal to test ${i18n.key}`, () => {
				expect(`test ${i18n.key}`).to.be.equal(replaceVariables('test {key ignore}', (_match, key) => i18n[key]));
			});
		});

		describe('key with multiple opening brackets', function functionName() {
			it(`should be equal to test {${i18n.key}`, () => {
				expect(`test {${i18n.key}`).to.be.equal(replaceVariables('test {{key}', (_match, key) => i18n[key]));
			});
		});

		describe('key with multiple closing brackets', function functionName() {
			it(`should be equal to test ${i18n.key}}`, () => {
				expect(`test ${i18n.key}}`).to.be.equal(replaceVariables('test {key}}', (_match, key) => i18n[key]));
			});
		});

		describe('key with multiple opening and closing brackets', function functionName() {
			it(`should be equal to test {${i18n.key}}`, () => {
				expect(`test {${i18n.key}}`).to.be.equal(replaceVariables('test {{key}}', (_match, key) => i18n[key]));
			});
		});
	});
});
