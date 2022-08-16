import { renderHook } from '@testing-library/react-hooks';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const date = new Date('2021-10-27T00:00:00.000Z');
const baseMessage = {
	ts: date,
	u: {
		_id: 'userId',
		name: 'userName',
		username: 'userName',
	},
	msg: 'message',
	rid: 'roomId',
	_id: 'messageId',
	_updatedAt: date,
	urls: [],
};

const baseStubs = {
	'./useAutotranslateLanguage': {
		useAutotranslateLanguage: (): boolean => false,
	},
	'@rocket.chat/ui-contexts': {
		useSetting: (): boolean => false,
	},
};

describe('useParsedMessage', () => {
	it('should call the parse function with message and parse options parameters if all settings is false', () => {
		const messageParser = sinon.spy();
		const { useParsedMessage } = proxyquire.noCallThru().load('./useParsedMessage', {
			...baseStubs,
			'@rocket.chat/message-parser': {
				parse: messageParser,
			},
		});
		renderHook(() => useParsedMessage(baseMessage));

		expect(messageParser.calledOnceWith(baseMessage.msg, { colors: false, emoticons: true })).to.be.true;
	});

	it('should call the parse function with katex in options parameters if Katex_Enabled is true', () => {
		const messageParser = sinon.spy();
		const { useParsedMessage } = proxyquire.noCallThru().load('./useParsedMessage', {
			...baseStubs,
			'@rocket.chat/ui-contexts': {
				useSetting: (setting: string): boolean => setting === 'Katex_Enabled',
			},
			'@rocket.chat/message-parser': {
				parse: messageParser,
			},
		});
		renderHook(() => useParsedMessage(baseMessage));

		expect(
			messageParser.calledOnceWith(baseMessage.msg, {
				colors: false,
				emoticons: true,
				katex: { dollarSyntax: false, parenthesisSyntax: false },
			}),
		).to.be.true;
	});

	it('should call the parse function without katex in options parameters if Katex_Enabled is false', () => {
		const messageParser = sinon.spy();
		const { useParsedMessage } = proxyquire.noCallThru().load('./useParsedMessage', {
			...baseStubs,
			'@rocket.chat/ui-contexts': {
				useSetting: (setting: string): boolean => setting !== 'Katex_Enabled',
			},
			'@rocket.chat/message-parser': {
				parse: messageParser,
			},
		});
		renderHook(() => useParsedMessage(baseMessage));

		expect(
			messageParser.calledOnceWith(baseMessage.msg, {
				colors: true,
				emoticons: true,
			}),
		).to.be.true;
	});
});
