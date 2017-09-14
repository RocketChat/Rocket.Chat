/* eslint-env mocha */
import 'babel-polyfill';
import assert from 'assert';

import Mentions from '../client/Mentions';
let mention;
beforeEach(function functionName() {
	mention = new Mentions({
		pattern: '[0-9a-zA-Z-_.]+',
		me: () => 'me'
	});
});
describe('Mention', function() {
	describe('get pattern', () => {
		const regexp = '[0-9a-zA-Z-_.]+';
		beforeEach(() => mention.pattern = () => regexp);
		describe('by function', function functionName() {
			it(`should be equal to ${ regexp }`, ()=> {
				assert.equal(regexp, mention.pattern);
			});
		});
		describe('by const', function functionName() {
			it(`should be equal to ${ regexp }`, ()=> {
				assert.equal(regexp, mention.pattern);
			});
		});
	});
	describe('get useRealName', () => {
		beforeEach(() => mention.useRealName = () => true);
		describe('by function', function functionName() {
			it('should be true', () => {
				assert.equal(true, mention.useRealName);
			});
		});
		describe('by const', function functionName() {
			it('should be true', () => {
				assert.equal(true, mention.useRealName);
			});
		});
	});
	describe('get me', () => {
		const me = 'me';
		describe('by function', function functionName() {
			beforeEach(() => mention.me = () => me);
			it(`should be equal to ${ me }`, ()=> {
				assert.equal(me, mention.me);
			});
		});
		describe('by const', function functionName() {
			beforeEach(() => mention.me = me);
			it(`should be equal to ${ me }`, ()=> {
				assert.equal(me, mention.me);
			});
		});
	});
	describe('getUserMentions', function functionName() {
		describe('for simple text, no mentions', () => {
			const result = [];
			[
				'#rocket.cat',
				'hello rocket.cat how are you?'
			]
				.forEach(text => {
					it(`should return "${ JSON.stringify(result) }" from "${ text }"`, () => {
						assert.deepEqual(result, mention.getUserMentions(text));
					});
				});
		});
		describe('for one user', () => {
			const result = ['@rocket.cat'];
			[
				'@rocket.cat',
				' @rocket.cat ',
				'hello @rocket.cat',
				'hello,@rocket.cat',
				'@rocket.cat, hello',
				'@rocket.cat,hello',
				'hello @rocket.cat how are you?'
			]
				.forEach(text => {
					it(`should return "${ JSON.stringify(result) }" from "${ text }"`, () => {
						assert.deepEqual(result, mention.getUserMentions(text));
					});
				});
			it.skip('should return without the "." from "@rocket.cat."', () => {
				assert.deepEqual(result, mention.getUserMentions('@rocket.cat.'));
			});
			it.skip('should return without the "_" from "@rocket.cat_"', () => {
				assert.deepEqual(result, mention.getUserMentions('@rocket.cat_'));
			});
			it.skip('should return without the "-" from "@rocket.cat."', () => {
				assert.deepEqual(result, mention.getUserMentions('@rocket.cat-'));
			});
		});
		describe('for two users', () => {
			const result = ['@rocket.cat', '@all'];
			[
				'@rocket.cat @all',
				' @rocket.cat @all ',
				'hello @rocket.cat and @all',
				'@rocket.cat, hello @all',
				'hello @rocket.cat and @all how are you?'
			]
				.forEach(text => {
					it(`should return "${ JSON.stringify(result) }" from "${ text }"`, () => {
						assert.deepEqual(result, mention.getUserMentions(text));
					});
				});
		});
	});

	describe('getChannelMentions', function functionName() {
		describe('for simple text, no mentions', () => {
			const result = [];
			[
				'@rocket.cat',
				'hello rocket.cat how are you?'
			]
				.forEach(text => {
					it(`should return "${ JSON.stringify(result) }" from "${ text }"`, () => {
						assert.deepEqual(result, mention.getChannelMentions(text));
					});
				});
		});
		describe('for one channel', () => {
			const result = ['#general'];
			[
				'#general',
				' #general ',
				'hello #general',
				'#general, hello',
				'hello #general, how are you?'
			].forEach(text => {
				it(`should return "${ JSON.stringify(result) }" from "${ text }"`, () => {
					assert.deepEqual(result, mention.getChannelMentions(text));
				});
			});
			it.skip('should return without the "." from "#general."', () => {
				assert.deepEqual(result, mention.getUserMentions('#general.'));
			});
			it.skip('should return without the "_" from "#general_"', () => {
				assert.deepEqual(result, mention.getUserMentions('#general_'));
			});
			it.skip('should return without the "-" from "#general."', () => {
				assert.deepEqual(result, mention.getUserMentions('#general-'));
			});
		});
		describe('for two channels', () => {
			const result = ['#general', '#other'];
			[
				'#general #other',
				' #general #other',
				'hello #general and #other',
				'#general, hello #other',
				'hello #general #other, how are you?'
			].forEach(text => {
				it(`should return "${ JSON.stringify(result) }" from "${ text }"`, () => {
					assert.deepEqual(result, mention.getChannelMentions(text));
				});
			});
		});
		describe('for url with fragments', () => {
			const result = [];
			[
				'http://localhost/#general'
			].forEach(text => {
				it(`should return nothing from "${ text }"`, () => {
					assert.deepEqual(result, mention.getChannelMentions(text));
				});
			});
		});
		describe('for messages with url and channels', () => {
			const result = ['#general'];
			[
				'http://localhost/#general #general'
			].forEach(text => {
				it(`should return "${ JSON.stringify(result) }" from "${ text }"`, () => {
					assert.deepEqual(result, mention.getChannelMentions(text));
				});
			});
		});
	});

});
const message = {
	mentions:[{username:'rocket.cat', name: 'Rocket.Cat'}, {username:'admin', name: 'Admin'}, {username: 'me', name: 'Me'}],
	channels: [{name: 'general'}, {name: 'rocket.cat'}]
};
describe('replace methods', function() {
	describe('replaceUsers', () => {
		it('should render for @all', () => {
			const result = mention.replaceUsers('@all', message, 'me');
			assert.equal('<a class="mention-link mention-link-me mention-link-all background-attention-color">@all</a>', result);
		});
		const str2 = '@rocket.cat';
		it(`should render for ${ str2 }`, () => {
			const result = mention.replaceUsers('@rocket.cat', message, 'me');
			assert.equal(result, `<a class="mention-link " data-username="${ str2.replace('@', '') }" title="">${ str2 }</a>`);
		});

		it(`should render for "hello ${ str2 }"`, () => {
			const result = mention.replaceUsers(`hello ${ str2 }`, message, 'me');
			assert.equal(result, `hello <a class="mention-link " data-username="${ str2.replace('@', '') }" title="">${ str2 }</a>`);
		});
		it('should render for unknow/private user "hello @unknow"', () => {
			const result = mention.replaceUsers('hello @unknow', message, 'me');
			assert.equal(result, 'hello @unknow');
		});
		it('should render for me', () => {
			const result = mention.replaceUsers('hello @me', message, 'me');
			assert.equal(result, 'hello <a class="mention-link mention-link-me background-primary-action-color" data-username="me" title="">@me</a>');
		});
	});

	describe('replaceUsers (RealNames)', () => {
		beforeEach(() => {
			mention.useRealName = () => true;
		});
		it('should render for @all', () => {
			const result = mention.replaceUsers('@all', message, 'me');
			assert.equal('<a class="mention-link mention-link-me mention-link-all background-attention-color">@all</a>', result);
		});

		const str2 = '@rocket.cat';
		const str2Name = 'Rocket.Cat';
		it(`should render for ${ str2 }`, () => {
			const result = mention.replaceUsers('@rocket.cat', message, 'me');
			assert.equal(result, `<a class="mention-link " data-username="${ str2.replace('@', '') }" title="${ str2.replace('@', '') }">${ str2Name }</a>`);
		});

		it(`should render for "hello ${ str2 }"`, () => {
			const result = mention.replaceUsers(`hello ${ str2 }`, message, 'me');
			assert.equal(result, `hello <a class="mention-link " data-username="${ str2.replace('@', '') }" title="${ str2.replace('@', '') }">${ str2Name }</a>`);
		});
		it('should render for unknow/private user "hello @unknow"', () => {
			const result = mention.replaceUsers('hello @unknow', message, 'me');
			assert.equal(result, 'hello @unknow');
		});
		it('should render for me', () => {
			const result = mention.replaceUsers('hello @me', message, 'me');
			assert.equal(result, 'hello <a class="mention-link mention-link-me background-primary-action-color" data-username="me" title="me">Me</a>');
		});
	});

	describe('replaceChannels', () => {
		it('should render for #general', () => {
			const result = mention.replaceChannels('#general', message);
			assert.equal('<a class="mention-link" data-channel="general">#general</a>', result);
		});
		const str2 = '#rocket.cat';
		it(`should render for ${ str2 }`, () => {
			const result = mention.replaceChannels(str2, message);
			assert.equal(result, `<a class="mention-link" data-channel="${ str2.replace('#', '') }">${ str2 }</a>`);
		});
		it(`should render for "hello ${ str2 }"`, () => {
			const result = mention.replaceChannels(`hello ${ str2 }`, message);
			console.log('result', result);
			assert.equal(result, `hello <a class="mention-link" data-channel="${ str2.replace('#', '') }">${ str2 }</a>`);
		});
		it('should render for unknow/private channel "hello #unknow"', () => {
			const result = mention.replaceChannels('hello #unknow', message);
			assert.equal(result, 'hello #unknow');
		});
	});

	describe('parse all', () => {
		it('should render for #general', () => {
			message.html = '#general';
			const result = mention.parse(message, 'me');
			assert.equal('<a class="mention-link" data-channel="general">#general</a>', result.html);
		});
		it('should render for "#general and @rocket.cat', () => {
			message.html = '#general and @rocket.cat';
			const result = mention.parse(message, 'me');
			assert.equal('<a class="mention-link" data-channel="general">#general</a> and <a class="mention-link " data-username="rocket.cat" title="">@rocket.cat</a>', result.html);
		});
		it('should render for "', () => {
			message.html = '';
			const result = mention.parse(message, 'me');
			assert.equal('', result.html);
		});
		it('should render for "simple text', () => {
			message.html = 'simple text';
			const result = mention.parse(message, 'me');
			assert.equal('simple text', result.html);
		});
	});

	describe('parse all (RealNames)', () => {
		beforeEach(() => {
			mention.useRealName = () => true;
		});
		it('should render for #general', () => {
			message.html = '#general';
			const result = mention.parse(message, 'me');
			assert.equal('<a class="mention-link" data-channel="general">#general</a>', result.html);
		});
		it('should render for "#general and @rocket.cat', () => {
			message.html = '#general and @rocket.cat';
			const result = mention.parse(message, 'me');
			assert.equal('<a class="mention-link" data-channel="general">#general</a> and <a class="mention-link " data-username="rocket.cat" title="rocket.cat">Rocket.Cat</a>', result.html);
		});
		it('should render for "', () => {
			message.html = '';
			const result = mention.parse(message, 'me');
			assert.equal('', result.html);
		});
		it('should render for "simple text', () => {
			message.html = 'simple text';
			const result = mention.parse(message, 'me');
			assert.equal('simple text', result.html);
		});
	});
});
