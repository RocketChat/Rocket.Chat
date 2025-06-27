import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const getUserDisplayNameStub = sinon.stub();
const i18nTranslateStub = sinon.stub();

const settingsGetStub = sinon.stub();

const { buildNotificationDetails } = proxyquire.noCallThru().load('./buildNotificationDetails.ts', {
	'../../../app/settings/server': {
		settings: { get: settingsGetStub },
	},
	'@rocket.chat/core-typings': {
		getUserDisplayName: getUserDisplayNameStub,
	},
	'../i18n': {
		i18n: { t: i18nTranslateStub },
	},
});

describe('buildNotificationDetails', () => {
	const room = { name: 'general' };
	const sender = { _id: 'id1', name: 'Alice', username: 'alice' };

	beforeEach(() => {
		settingsGetStub.reset();
		getUserDisplayNameStub.reset();
		i18nTranslateStub.reset();
	});

	const languageFallback = 'You_have_a_new_message';

	const testCases = [
		{ showPushMessage: true, showName: true, expectPrefix: true },
		{ showPushMessage: true, showName: false, expectPrefix: false },
		{ showPushMessage: false, showName: true, expectPrefix: false },
		{ showPushMessage: false, showName: false, expectPrefix: false },
	];

	testCases.forEach(({ showPushMessage, showName, expectPrefix }) => {
		const label = `Push_show_message=${showPushMessage}, Push_show_username_room=${showName}`;

		it(`should return correct fields when ${label}`, () => {
			settingsGetStub.withArgs('Push_show_message').returns(showPushMessage);
			settingsGetStub.withArgs('Push_show_username_room').returns(showName);
			settingsGetStub.withArgs('UI_Use_Real_Name').returns(false);
			settingsGetStub.withArgs('Language').returns('en');

			const expectedMessage = 'Test message';
			const expectedTitle = 'Some Room Title';
			const senderDisplayName = 'Alice';

			getUserDisplayNameStub.returns(senderDisplayName);
			i18nTranslateStub.withArgs('You_have_a_new_message', { lng: 'en' }).returns(languageFallback);

			const result = buildNotificationDetails({
				expectedNotificationMessage: expectedMessage,
				expectedTitle,
				room,
				sender,
				language: undefined,
				senderNameExpectedInMessage: true,
			});

			const shouldShowTitle = showName;
			const shouldPrefix = showPushMessage && showName && expectPrefix;

			expect(result.title).to.equal(shouldShowTitle ? expectedTitle : undefined);
			expect(result.name).to.equal(shouldShowTitle ? room.name : undefined);

			if (!showPushMessage) {
				expect(result.text).to.equal(languageFallback);
			} else if (shouldPrefix) {
				expect(result.text).to.equal(`${senderDisplayName}: ${expectedMessage}`);
			} else {
				expect(result.text).to.equal(expectedMessage);
			}
		});
	});

	it('should respect provided language if supplied', () => {
		settingsGetStub.withArgs('Push_show_message').returns(false);
		settingsGetStub.withArgs('Push_show_username_room').returns(false);
		i18nTranslateStub.withArgs('You_have_a_new_message', { lng: 'fr' }).returns('Vous avez un nouveau message');

		const result = buildNotificationDetails({
			expectedNotificationMessage: 'ignored',
			room,
			sender,
			language: 'fr',
			senderNameExpectedInMessage: false,
		});

		expect(result.text).to.equal('Vous avez un nouveau message');
	});
});
