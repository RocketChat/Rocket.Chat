/* eslint-env mocha */
import assert from 'assert';

import { replaceVariables } from '../server/utils.js';

describe('Mailer-API', function() {
	describe('translate', () => {
		const i18n = {
			key: 'value',
		};

		describe('single key', function functionName() {
			it(`should be equal to test ${ i18n.key }`, () => {
				assert.equal(`test ${ i18n.key }`, replaceVariables('test {key}', (match, key) => i18n[key]));
			});
		});

		describe('multiple keys', function functionName() {
			it(`should be equal to test ${ i18n.key } and ${ i18n.key }`, () => {
				assert.equal(`test ${ i18n.key } and ${ i18n.key }`, replaceVariables('test {key} and {key}', (match, key) => i18n[key]));
			});
		});

		describe('key with a trailing space', function functionName() {
			it(`should be equal to test ${ i18n.key }`, () => {
				assert.equal(`test ${ i18n.key }`, replaceVariables('test {key }', (match, key) => i18n[key]));
			});
		});

		describe('key with a leading space', function functionName() {
			it(`should be equal to test ${ i18n.key }`, () => {
				assert.equal(`test ${ i18n.key }`, replaceVariables('test { key}', (match, key) => i18n[key]));
			});
		});

		describe('key with leading and trailing spaces', function functionName() {
			it(`should be equal to test ${ i18n.key }`, () => {
				assert.equal(`test ${ i18n.key }`, replaceVariables('test { key }', (match, key) => i18n[key]));
			});
		});

		describe('key with multiple words', function functionName() {
			it(`should be equal to test ${ i18n.key }`, () => {
				assert.equal(`test ${ i18n.key }`, replaceVariables('test {key ignore}', (match, key) => i18n[key]));
			});
		});

		describe('key with multiple opening brackets', function functionName() {
			it(`should be equal to test {${ i18n.key }`, () => {
				assert.equal(`test {${ i18n.key }`, replaceVariables('test {{key}', (match, key) => i18n[key]));
			});
		});

		describe('key with multiple closing brackets', function functionName() {
			it(`should be equal to test ${ i18n.key }}`, () => {
				assert.equal(`test ${ i18n.key }}`, replaceVariables('test {key}}', (match, key) => i18n[key]));
			});
		});

		describe('key with multiple opening and closing brackets', function functionName() {
			it(`should be equal to test {${ i18n.key }}`, () => {
				assert.equal(`test {${ i18n.key }}`, replaceVariables('test {{key}}', (match, key) => i18n[key]));
			});
		});
	});
});
