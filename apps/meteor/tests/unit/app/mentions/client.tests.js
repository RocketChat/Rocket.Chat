import { expect } from 'chai';

import { MentionsParser } from '../../../../app/mentions/lib/MentionsParser';

let mentionsParser;
beforeEach(() => {
	mentionsParser = new MentionsParser({
		pattern: '[0-9a-zA-Z-_.]+',
		me: () => 'me',
	});
});

describe('Mention', function () {
	describe('get pattern', () => {
		const regexp = '[0-9a-zA-Z-_.]+';
		beforeEach(() => {
			mentionsParser.pattern = () => regexp;
		});

		describe('by function', () => {
			it(`should be equal to ${regexp}`, () => {
				expect(regexp).to.be.equal(mentionsParser.pattern);
			});
		});

		describe('by const', () => {
			it(`should be equal to ${regexp}`, () => {
				expect(regexp).to.be.equal(mentionsParser.pattern);
			});
		});
	});

	describe('get useRealName', () => {
		beforeEach(() => {
			mentionsParser.useRealName = () => true;
		});

		describe('by function', () => {
			it('should be true', () => {
				expect(true).to.be.equal(mentionsParser.useRealName);
			});
		});

		describe('by const', () => {
			it('should be true', () => {
				expect(true).to.be.equal(mentionsParser.useRealName);
			});
		});
	});

	describe('get me', () => {
		const me = 'me';

		describe('by function', () => {
			beforeEach(() => {
				mentionsParser.me = () => me;
			});

			it(`should be equal to ${me}`, () => {
				expect(me).to.be.equal(mentionsParser.me);
			});
		});

		describe('by const', () => {
			beforeEach(() => {
				mentionsParser.me = me;
			});

			it(`should be equal to ${me}`, () => {
				expect(me).to.be.equal(mentionsParser.me);
			});
		});
	});

	describe('getUserMentions', () => {
		describe('for simple text, no mentions', () => {
			const result = [];
			['#rocket.cat', 'hello rocket.cat how are you?'].forEach((text) => {
				it(`should return "${JSON.stringify(result)}" from "${text}"`, () => {
					expect(result).to.be.deep.equal(mentionsParser.getUserMentions(text));
				});
			});
		});

		describe('for one user', () => {
			const result = ['@rocket.cat'];
			[
				'@rocket.cat',
				' @rocket.cat ',
				'hello @rocket.cat',
				// 'hello,@rocket.cat', // this test case is ignored since is not compatible with the message box behavior
				'@rocket.cat, hello',
				'@rocket.cat,hello',
				'hello @rocket.cat how are you?',
			].forEach((text) => {
				it(`should return "${JSON.stringify(result)}" from "${text}"`, () => {
					expect(result).to.be.deep.equal(mentionsParser.getUserMentions(text));
				});
			});

			it.skip('should return without the "." from "@rocket.cat."', () => {
				expect(result).to.be.deep.equal(mentionsParser.getUserMentions('@rocket.cat.'));
			});

			it.skip('should return without the "_" from "@rocket.cat_"', () => {
				expect(result).to.be.deep.equal(mentionsParser.getUserMentions('@rocket.cat_'));
			});

			it.skip('should return without the "-" from "@rocket.cat-"', () => {
				expect(result).to.be.deep.equal(mentionsParser.getUserMentions('@rocket.cat-'));
			});
		});

		describe('for two users', () => {
			const result = ['@rocket.cat', '@all'];
			[
				'@rocket.cat @all',
				' @rocket.cat @all ',
				'hello @rocket.cat and @all',
				'@rocket.cat, hello @all',
				'hello @rocket.cat and @all how are you?',
			].forEach((text) => {
				it(`should return "${JSON.stringify(result)}" from "${text}"`, () => {
					expect(result).to.be.deep.equal(mentionsParser.getUserMentions(text));
				});
			});
		});
	});

	describe('getChannelMentions', () => {
		describe('for simple text, no mentions', () => {
			const result = [];
			['@rocket.cat', 'hello rocket.cat how are you?'].forEach((text) => {
				it(`should return "${JSON.stringify(result)}" from "${text}"`, () => {
					expect(result).to.be.deep.equal(mentionsParser.getChannelMentions(text));
				});
			});
		});

		describe('for one channel', () => {
			const result = ['#general'];
			['#general', ' #general ', 'hello #general', '#general, hello', 'hello #general, how are you?'].forEach((text) => {
				it(`should return "${JSON.stringify(result)}" from "${text}"`, () => {
					expect(result).to.be.deep.equal(mentionsParser.getChannelMentions(text));
				});
			});

			it.skip('should return without the "." from "#general."', () => {
				expect(result).to.be.deep.equal(mentionsParser.getUserMentions('#general.'));
			});

			it.skip('should return without the "_" from "#general_"', () => {
				expect(result).to.be.deep.equal(mentionsParser.getUserMentions('#general_'));
			});

			it.skip('should return without the "-" from "#general."', () => {
				expect(result).to.be.deep.equal(mentionsParser.getUserMentions('#general-'));
			});
		});

		describe('for two channels', () => {
			const result = ['#general', '#other'];
			[
				'#general #other',
				' #general #other',
				'hello #general and #other',
				'#general, hello #other',
				'hello #general #other, how are you?',
			].forEach((text) => {
				it(`should return "${JSON.stringify(result)}" from "${text}"`, () => {
					expect(result).to.be.deep.equal(mentionsParser.getChannelMentions(text));
				});
			});
		});

		describe('for url with fragments', () => {
			const result = [];
			['http://localhost/#general'].forEach((text) => {
				it(`should return nothing from "${text}"`, () => {
					expect(result).to.be.deep.equal(mentionsParser.getChannelMentions(text));
				});
			});
		});

		describe('for messages with url and channels', () => {
			const result = ['#general'];
			['http://localhost/#general #general'].forEach((text) => {
				it(`should return "${JSON.stringify(result)}" from "${text}"`, () => {
					expect(result).to.be.deep.equal(mentionsParser.getChannelMentions(text));
				});
			});
		});
	});
});

const message = {
	mentions: [
		{ username: 'rocket.cat', name: 'Rocket.Cat' },
		{ username: 'admin', name: 'Admin' },
		{ username: 'me', name: 'Me' },
		{ username: 'specialchars', name: '<img onerror=alert(hello)>' },
	],
	channels: [
		{ name: 'general', _id: '42' },
		{ name: 'rocket.cat', _id: '169' },
	],
};

describe('replace methods', function () {
	describe('replaceUsers', () => {
		it('should render for @all', () => {
			const result = mentionsParser.replaceUsers('@all', message, 'me');
			expect(result).to.be.equal('<a class="mention-link mention-link--all mention-link--group" data-group="all">all</a>');
		});

		const str2 = 'rocket.cat';

		it(`should render for "@${str2}"`, () => {
			const result = mentionsParser.replaceUsers(`@${str2}`, message, 'me');
			expect(result).to.be.equal(`<a class="mention-link mention-link--user" data-username="${str2}" title="${str2}">${str2}</a>`);
		});

		it(`should render for "hello ${str2}"`, () => {
			const result = mentionsParser.replaceUsers(`hello @${str2}`, message, 'me');
			expect(result).to.be.equal(`hello <a class="mention-link mention-link--user" data-username="${str2}" title="${str2}">${str2}</a>`);
		});

		it('should render for unknow/private user "hello @unknow"', () => {
			const result = mentionsParser.replaceUsers('hello @unknow', message, 'me');
			expect(result).to.be.equal('hello @unknow');
		});

		it('should render for me', () => {
			const result = mentionsParser.replaceUsers('hello @me', message, 'me');
			expect(result).to.be.equal('hello <a class="mention-link mention-link--me mention-link--user" data-username="me" title="me">me</a>');
		});
	});

	describe('replaceUsers (RealNames)', () => {
		beforeEach(() => {
			mentionsParser.useRealName = () => true;
		});

		it('should render for @all', () => {
			const result = mentionsParser.replaceUsers('@all', message, 'me');
			expect(result).to.be.equal('<a class="mention-link mention-link--all mention-link--group" data-group="all">all</a>');
		});

		const str2 = 'rocket.cat';
		const str2Name = 'Rocket.Cat';

		it(`should render for "@${str2}"`, () => {
			const result = mentionsParser.replaceUsers(`@${str2}`, message, 'me');
			expect(result).to.be.equal(`<a class="mention-link mention-link--user" data-username="${str2}" title="${str2}">${str2Name}</a>`);
		});

		it(`should render for "hello @${str2}"`, () => {
			const result = mentionsParser.replaceUsers(`hello @${str2}`, message, 'me');
			expect(result).to.be.equal(
				`hello <a class="mention-link mention-link--user" data-username="${str2}" title="${str2}">${str2Name}</a>`,
			);
		});

		const specialchars = 'specialchars';
		const specialcharsName = '&lt;img onerror=alert(hello)&gt;';

		it(`should escape special characters in "hello @${specialchars}"`, () => {
			const result = mentionsParser.replaceUsers(`hello @${specialchars}`, message, 'me');
			expect(result).to.be.equal(
				`hello <a class="mention-link mention-link--user" data-username="${specialchars}" title="${specialchars}">${specialcharsName}</a>`,
			);
		});

		it(`should render for "hello<br>@${str2} <br>"`, () => {
			const result = mentionsParser.replaceUsers(`hello<br>@${str2} <br>`, message, 'me');
			expect(result).to.be.equal(
				`hello<br><a class="mention-link mention-link--user" data-username="${str2}" title="${str2}">${str2Name}</a> <br>`,
			);
		});

		it('should render for unknow/private user "hello @unknow"', () => {
			const result = mentionsParser.replaceUsers('hello @unknow', message, 'me');
			expect(result).to.be.equal('hello @unknow');
		});

		it('should render for me', () => {
			const result = mentionsParser.replaceUsers('hello @me', message, 'me');
			expect(result).to.be.equal('hello <a class="mention-link mention-link--me mention-link--user" data-username="me" title="me">Me</a>');
		});
	});

	describe('replaceChannels', () => {
		it('should render for #general', () => {
			const result = mentionsParser.replaceChannels('#general', message);
			expect('<).to.be.equal(class="mention-link mention-link--room" data-channel="42">#general</a>', result);
		});

		const str2 = '#rocket.cat';

		it(`should render for ${str2}`, () => {
			const result = mentionsParser.replaceChannels(str2, message);
			expect(result).to.be.equal(`<a class="mention-link mention-link--room" data-channel="169">${str2}</a>`);
		});

		it(`should render for "hello ${str2}"`, () => {
			const result = mentionsParser.replaceChannels(`hello ${str2}`, message);
			expect(result).to.be.equal(`hello <a class="mention-link mention-link--room" data-channel="169">${str2}</a>`);
		});

		it('should render for unknow/private channel "hello #unknow"', () => {
			const result = mentionsParser.replaceChannels('hello #unknow', message);
			expect(result).to.be.equal('hello #unknow');
		});
	});

	describe('parse all', () => {
		it('should render for #general', () => {
			message.html = '#general';
			const result = mentionsParser.parse(message, 'me');
			expect(result.html).to.be.equal('<a class="mention-link mention-link--room" data-channel="42">#general</a>');
		});

		it('should render for "#general and @rocket.cat', () => {
			message.html = '#general and @rocket.cat';
			const result = mentionsParser.parse(message, 'me');
			expect(result.html).to.be.equal(
				'<a class="mention-link mention-link--room" data-channel="42">#general</a> and <a class="mention-link mention-link--user" data-username="rocket.cat" title="rocket.cat">rocket.cat</a>',
			);
		});

		it('should render for "', () => {
			message.html = '';
			const result = mentionsParser.parse(message, 'me');
			expect(result.html).to.be.equal('');
		});

		it('should render for "simple text', () => {
			message.html = 'simple text';
			const result = mentionsParser.parse(message, 'me');
			expect(result.html).to.be.equal('simple text');
		});
	});

	describe('parse all (RealNames)', () => {
		beforeEach(() => {
			mentionsParser.useRealName = () => true;
		});

		it('should render for #general', () => {
			message.html = '#general';
			const result = mentionsParser.parse(message, 'me');
			expect(result.html).to.be.equal('<a class="mention-link mention-link--room" data-channel="42">#general</a>');
		});

		it('should render for "#general and @rocket.cat', () => {
			message.html = '#general and @rocket.cat';
			const result = mentionsParser.parse(message, 'me');
			expect(result.html).to.be.equal(
				'<a class="mention-link mention-link--room" data-channel="42">#general</a> and <a class="mention-link mention-link--user" data-username="rocket.cat" title="rocket.cat">Rocket.Cat</a>',
			);
		});

		it('should render for "', () => {
			message.html = '';
			const result = mentionsParser.parse(message, 'me');
			expect(result.html).to.be.equal('');
		});

		it('should render for "simple text', () => {
			message.html = 'simple text';
			const result = mentionsParser.parse(message, 'me');
			expect(result.html).to.be.equal('simple text');
		});
	});
});
