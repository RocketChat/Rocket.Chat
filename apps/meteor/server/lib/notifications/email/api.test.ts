import { afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import * as apps from '@rocket.chat/apps';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

import { replaceVariables } from './replaceVariables';

const initialSettings: Record<string, unknown> = {
	Site_Name: 'Rocket Team',
	Site_Url: 'https://chat.example.com',
	Email_Header: '<header>[Site_Name]</header>',
	Email_Footer: '<footer>bye</footer>',
};
const settingValues: Record<string, unknown> = { ...initialSettings };
const watchers = new Map<string, ((value: unknown) => void)[]>();
const multiWatchers: { ids: string[]; callback: () => void }[] = [];

const settingsMock = {
	get: (id: string) => settingValues[id],
	watch: (id: string, callback: (value: unknown) => void) => {
		watchers.set(id, [...(watchers.get(id) ?? []), callback]);
		callback(settingValues[id]);
	},
	watchMultiple: (ids: string[], callback: () => void) => {
		multiWatchers.push({ ids, callback });
		callback();
	},
};

const changeSetting = (id: string, value: unknown) => {
	settingValues[id] = value;
	watchers.get(id)?.forEach((callback) => callback(value));
	multiWatchers.filter(({ ids }) => ids.includes(id)).forEach(({ callback }) => callback());
};

const sendMail = sinon.stub();
const triggerEvent = sinon.stub();
const incrementValueById = sinon.stub();

let Mailer: any;

before(async () => {
	const moduleMocks = [
		mock.module('../../../settings', { exports: { settings: settingsMock } }),
		mock.module('../../i18n', { exports: { i18n: { t: (key: string) => `t:${key}` } } }),
		mock.module('./transport', { exports: { sendMail } }),
		mock.module('@rocket.chat/apps', { exports: { ...apps, Apps: { self: { triggerEvent } } } }),
	];
	Mailer = await import('./api');
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

const deliveredEmail = async () => {
	await new Promise((resolve) => setImmediate(resolve));
	return sendMail.firstCall?.args[0];
};

describe('Mailer-API', () => {
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

describe('Mailer API', () => {
	const email = { to: 'ana@example.com', from: 'rocket@example.com', subject: 'Hello' };

	before(() => {
		mockModel('Settings', { incrementValueById });
	});

	beforeEach(() => {
		sendMail.reset();
		sendMail.resolves();
		triggerEvent.reset();
		incrementValueById.reset();
	});

	afterEach(() => {
		for (const [id, value] of Object.entries(initialSettings)) {
			if (settingValues[id] !== value) {
				changeSetting(id, value);
			}
		}
		delete settingValues.email_plain_text_only;
	});

	it('should fill translated, site and name variables in the subject, the HTML and the text', async () => {
		await Mailer.send({
			...email,
			subject: '{Welcome} [fname]',
			html: '<p>[lname] at [Site_URL]</p>',
			text: '[name] at [Site_Name]',
			data: { name: 'Ana Lee' },
		});

		const sent = await deliveredEmail();
		expect(sent.subject).to.equal('t:Welcome Ana');
		expect(sent.html).to.include('<p>Lee at https://chat.example.com</p>');
		expect(sent.text).to.equal('Ana Lee at Rocket Team');
	});

	it('should escape the substituted values in the HTML and keep the room path', async () => {
		await Mailer.send({ ...email, html: '<p>[name] [room_path]</p>', data: { name: '<b>Ana</b>', room_path: '/room?id=1&tab=info' } });

		const sent = await deliveredEmail();
		expect(sent.html).to.include('<p>&lt;b&gt;Ana&lt;/b&gt; /room?id=1&tab=info</p>');
	});

	it('should build the text from the HTML when no text is given', async () => {
		await Mailer.send({ ...email, html: '<p>Hello <b>[name]</b></p>', data: { name: 'Ana' } });

		expect((await deliveredEmail()).text).to.equal('Hello Ana');
	});

	it('should keep link targets in the text built from the HTML', async () => {
		await Mailer.send({
			...email,
			html: '<p>Hi</p><a class="btn" href="[Forgot_Password_Url]">Reset</a>',
			data: { Forgot_Password_Url: 'https://chat.example.com/reset/abc' },
		});

		expect((await deliveredEmail()).text).to.equal('Hi Reset (https://chat.example.com/reset/abc)');
	});

	it('should send no HTML in plain-text-only mode', async () => {
		settingValues.email_plain_text_only = true;

		await Mailer.send({ ...email, html: '<p>Hello</p>' });

		const sent = await deliveredEmail();
		expect(sent.html).to.be.undefined;
		expect(sent.text).to.equal('Hello');
	});

	it('should keep link targets in the text sent in plain-text-only mode', async () => {
		settingValues.email_plain_text_only = true;

		await Mailer.sendNoWrap({ ...email, html: '<a href="https://chat.example.com/verify/abc">Verify</a>' });

		const sent = await deliveredEmail();
		expect(sent.html).to.be.undefined;
		expect(sent.text).to.equal('Verify (https://chat.example.com/verify/abc)');
	});

	it('should wrap the HTML with the header and footer', async () => {
		await Mailer.send({ ...email, html: '<p>Body</p>' });

		expect((await deliveredEmail()).html).to.match(/<header>Rocket Team<\/header>.*<p>Body<\/p>.*<footer>bye<\/footer>/s);
	});

	it('should rewrap a template with the new header once Email_Header changes', async (t) => {
		settingValues.Test_Template = '<p>Join us</p>';
		t.after(() => delete settingValues.Test_Template);
		let deliver: (html: string) => void = () => undefined;
		const nextWrap = () =>
			new Promise<string>((resolve) => {
				deliver = resolve;
			});

		const first = nextWrap();
		Mailer.getTemplateWrapped('Test_Template', (html: string) => deliver(html));
		expect(await first)
			.to.include('<header>Rocket Team</header>')
			.and.include('<p>Join us</p>');

		const second = nextWrap();
		changeSetting('Email_Header', '<header>New header</header>');
		expect(await second)
			.to.include('<header>New header</header>')
			.and.include('<p>Join us</p>');
	});

	it('should send through sendNoWrap without the header and footer', async () => {
		await Mailer.sendNoWrap({ ...email, html: '<p>Body</p>' });

		const sent = await deliveredEmail();
		expect(sent.html).to.equal('<p>Body</p>');
		expect(sent.text).to.equal('Body');
	});

	it('should reject an invalid recipient in a list before the Apps hook, the count and the delivery', async () => {
		await expect(Mailer.send({ ...email, to: ['ana@example.com', 'not-an-address'], text: 'Hello' })).to.be.rejectedWith('invalid email');

		expect(await deliveredEmail()).to.be.undefined;
		expect(triggerEvent.called).to.be.false;
		expect(incrementValueById.called).to.be.false;
	});

	it('should send the email returned by the Apps hook and count it', async () => {
		const changedByApp = { ...email, subject: 'Changed by an app', text: 'Changed' };
		triggerEvent.resolves(changedByApp);

		await Mailer.send({ ...email, text: 'Original' });

		expect(await deliveredEmail()).to.deep.equal(changedByApp);
		expect(incrementValueById.calledOnceWith('Triggered_Emails_Count', 1)).to.be.true;
	});

	it('should throw the defined error for an invalid sender address', () => {
		expect(() => Mailer.checkAddressFormatAndThrow('not-an-address', 'sendTest')).to.throw('Invalid from address');
		expect(() => Mailer.checkAddressFormatAndThrow('rocket@example.com', 'sendTest')).to.not.throw();
	});
});
