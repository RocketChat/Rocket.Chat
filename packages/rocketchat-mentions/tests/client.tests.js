/* eslint-env mocha */
import assert from 'assert';

global.RocketChat = typeof global.RocketChat === 'undefined' ? {} : global.RocketChat;

const confs = {
	'UTF8_Names_Validation' : '[0-9a-zA-Z-_.]+'
};

global.RocketChat.settings = {
	get(key) {
		return confs[key];
	}
};

const {msgMentionRegex, msgChannelRegex, replaceUsers, replaceChannels} = require('../mentions').default(RocketChat);

describe('Testing regex\'s', function() {
	describe(`msgMentionRegex: ${ msgMentionRegex }`, function() {
		const str1 = '@rocket.cat';
		it(`one user '${ str1 }'`, function functionName() {
			const result = str1.match(msgMentionRegex)|| [];
			assert.equal(result.length, 1);
		});

		it('two users \'@rocket.cat @all\'', function functionName() {
			const result = '@rocket.cat @all'.match(msgMentionRegex)|| [];
			assert.equal(result.length, 2);
		});

		const strTest3 = 'hello @rocket.cat';
		it(`text before user '${ strTest3 }'`, function functionName() {
			const result = strTest3.match(msgMentionRegex)|| [];
			assert.equal(result.length, 1);
		});

		const strTest4 = '@rocket.cat, hello';
		it(`text after user '${ strTest4 }'`, function functionName() {
			const result = strTest4.match(msgMentionRegex)|| [];
			assert.equal(result.length, 1);
		});

		const strTest5 = '@rocket.cat and @user';
		it(`text between users '${ strTest5 }'`, function functionName() {
			const result = strTest5.match(msgMentionRegex)|| [];
			assert.equal(result.length, 2);
		});

	});

	describe(`msgChannelRegex: ${ msgChannelRegex }`, function() {
		const str1 = '#general';
		it(`one channel '${ str1 }'`, function functionName() {
			const result = str1.match(msgChannelRegex)|| [];
			assert.equal(result.length, 1);
		});
		const str2 = '#general #private';
		it(`two channels '${ str2 }'`, function functionName() {
			const result = str2.match(msgChannelRegex)|| [];
			assert.equal(result.length, 2);
		});
		const strTest3 = 'hello #general';
		it(`text before channels '${ strTest3 }'`, function functionName() {
			const result = strTest3.match(msgChannelRegex)|| [];
			assert.equal(result.length, 1);
		});
		const strTest4 = '#general, hello';
		it(`text after channel '${ strTest4 }'`, function functionName() {
			const result = strTest4.match(msgChannelRegex)|| [];
			assert.equal(result.length, 1);
		});

		const strTest5 = '#general and #private';
		it(`text between channels '${ strTest5 }'`, function functionName() {
			const result = strTest5.match(msgChannelRegex)|| [];
			assert.equal(result.length, 2);
		});
	});

});

describe('Testing replace functions', function() {
	const message = {
		mentions:[{username:'rocket.cat'}, {username:'admin'}],
		channels: [{name: 'general'}]
	};
	const me = 'admin';
	describe('function replaceChannels', function() {
		const str1 = '#general';
		it(`an public existent channel '${ str1 }'`, function() {
			const result = str1.replace(msgChannelRegex, (match, mention, name) => replaceChannels.apply(this, [match, mention, name, message]));
			assert.equal(result, `<a class="mention-link" data-channel="${ str1.replace('#', '') }">${ str1 }</a>`);
		});

		const str2 = '#private';
		it(`an private or non existent channel '${ str2 }'`, function() {
			const result = str2.replace(msgChannelRegex, (match, mention, name) => replaceChannels.apply(this, [match, mention, name, message]));
			assert.equal(result, str2);
		});
	});
	describe('function replaceUsers', function() {
		const str1 = '@unknow.user';
		it(`an unknow user '${ str1 }'`, function() {
			const result = str1.replace(msgMentionRegex, (match, mention, username) => replaceUsers.apply(this, [match, mention, username, message, me]));
			assert.equal(result, str1);
		});
		const str2 = '@rocket.cat';
		it(`a know user '${ str2 }'`, function() {
			const result = str2.replace(msgMentionRegex, (match, mention, username) => replaceUsers.apply(this, [match, mention, username, message, me]));
			assert.equal(result, `<a class="mention-link " data-username="${ str2.replace('@', '') }">${ str2 }</a>`);
		});

		const str3 = '@all';
		it(`'${ str3 }'`, function() {
			const result = str3.replace(msgMentionRegex, (match, mention, username) => replaceUsers.apply(this, [match, mention, username, message, me]));
			assert.equal(result, `<a class="mention-link mention-link-me mention-link-all background-attention-color">${ str3 }</a>`);
		});

		const str4 = '@here';
		it(`'${ str4 }'`, function() {
			const result = str4.replace(msgMentionRegex, (match, mention, username) => replaceUsers.apply(this, [match, mention, username, message, me]));
			assert.equal(result, `<a class="mention-link mention-link-me mention-link-all background-attention-color">${ str4 }</a>`);
		});

		const str5 = '@admin';
		it(`me '${ str5 }'`, function() {
			const result = str5.replace(msgMentionRegex, (match, mention, username) => replaceUsers.apply(this, [match, mention, username, message, me]));
			assert.equal(result, `<a class="mention-link mention-link-me background-primary-action-color" data-username="${ str5.replace('@', '') }">${ str5 }</a>`);
		});
	});
});
