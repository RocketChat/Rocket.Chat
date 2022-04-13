import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { sendSimpleMessage } from '../../data/chat.helper';

describe('AutoTranslate', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[AutoTranslate]', () => {
		describe('[/autotranslate.getSupportedLanguages', () => {
			it('should throw an error when the "AutoTranslate_Enabled" setting is disabled', (done) => {
				updateSetting('AutoTranslate_Enabled', false).then(() => {
					request
						.get(api('autotranslate.getSupportedLanguages'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', false);
							expect(res.body.error).to.be.equal('AutoTranslate is disabled.');
						})
						.end(done);
				});
			});
			it('should throw an error when the user does not have the "auto-translate" permission', (done) => {
				updateSetting('AutoTranslate_Enabled', true).then(() => {
					updatePermission('auto-translate', []).then(() => {
						request
							.get(api('autotranslate.getSupportedLanguages'))
							.set(credentials)
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((res) => {
								expect(res.body).to.have.a.property('success', false);
								expect(res.body.errorType).to.be.equal('error-action-not-allowed');
								expect(res.body.error).to.be.equal('Auto-Translate is not allowed [error-action-not-allowed]');
							})
							.end(done);
					});
				});
			});
			it('should return a list of languages', (done) => {
				updatePermission('auto-translate', ['admin']).then(() => {
					request
						.get(api('autotranslate.getSupportedLanguages'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body.languages).to.be.an('array');
						})
						.end(done);
				});
			});
		});
		describe('[/autotranslate.saveSettings', () => {
			it('should throw an error when the "AutoTranslate_Enabled" setting is disabled', (done) => {
				updateSetting('AutoTranslate_Enabled', false).then(() => {
					request
						.post(api('autotranslate.saveSettings'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', false);
							expect(res.body.error).to.be.equal('AutoTranslate is disabled.');
						})
						.end(done);
				});
			});
			it('should throw an error when the user does not have the "auto-translate" permission', (done) => {
				updateSetting('AutoTranslate_Enabled', true).then(() => {
					updatePermission('auto-translate', []).then(() => {
						request
							.post(api('autotranslate.saveSettings'))
							.set(credentials)
							.send({
								roomId: 'GENERAL',
								field: 'autoTranslateLanguage',
								value: 'en',
							})
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((res) => {
								expect(res.body).to.have.a.property('success', false);
								expect(res.body.errorType).to.be.equal('error-action-not-allowed');
								expect(res.body.error).to.be.equal('Auto-Translate is not allowed [error-action-not-allowed]');
							})
							.end(done);
					});
				});
			});
			it('should throw an error when the bodyParam "roomId" is not provided', (done) => {
				updatePermission('auto-translate', ['admin']).then(() => {
					request
						.post(api('autotranslate.saveSettings'))
						.set(credentials)
						.send({})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', false);
							expect(res.body.error).to.be.equal('The bodyParam "roomId" is required.');
						})
						.end(done);
				});
			});
			it('should throw an error when the bodyParam "field" is not provided', (done) => {
				request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: 'GENERAL',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.error).to.be.equal('The bodyParam "field" is required.');
					})
					.end(done);
			});
			it('should throw an error when the bodyParam "value" is not provided', (done) => {
				request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: 'GENERAL',
						field: 'autoTranslate',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.error).to.be.equal('The bodyParam "value" is required.');
					})
					.end(done);
			});
			it('should throw an error when the bodyParam "autoTranslate" is not a boolean', (done) => {
				request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: 'GENERAL',
						field: 'autoTranslate',
						value: 'test',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.error).to.be.equal('The bodyParam "autoTranslate" must be a boolean.');
					})
					.end(done);
			});
			it('should throw an error when the bodyParam "autoTranslateLanguage" is not a string', (done) => {
				request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: 'GENERAL',
						field: 'autoTranslateLanguage',
						value: 12,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.error).to.be.equal('The bodyParam "autoTranslateLanguage" must be a string.');
					})
					.end(done);
			});
			it('should throw an error when the bodyParam "field" is invalid', (done) => {
				request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: 'GENERAL',
						field: 'invalid',
						value: 12,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.errorType).to.be.equal('error-invalid-settings');
						expect(res.body.error).to.be.equal('Invalid settings field [error-invalid-settings]');
					})
					.end(done);
			});
			it('should throw an error when the bodyParam "roomId" is invalid or the user is not subscribed', (done) => {
				request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: 'invalid',
						field: 'autoTranslateLanguage',
						value: 'en',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.errorType).to.be.equal('error-invalid-subscription');
						expect(res.body.error).to.be.equal('Invalid subscription [error-invalid-subscription]');
					})
					.end(done);
			});
			it('should return success when the setting is saved correctly', (done) => {
				request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: 'GENERAL',
						field: 'autoTranslateLanguage',
						value: 'en',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
					})
					.end(done);
			});
		});
		describe('[/autotranslate.translateMessage', () => {
			let messageSent;

			before((done) => {
				sendSimpleMessage({
					roomId: 'GENERAL',
					text: 'Isso é um teste',
				}).end((err, res) => {
					messageSent = res.body.message;
					done();
				});
			});

			it('should throw an error when the "AutoTranslate_Enabled" setting is disabled', (done) => {
				updateSetting('AutoTranslate_Enabled', false).then(() => {
					request
						.post(api('autotranslate.translateMessage'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', false);
							expect(res.body.error).to.be.equal('AutoTranslate is disabled.');
						})
						.end(done);
				});
			});
			it('should throw an error when the bodyParam "messageId" is not provided', (done) => {
				updateSetting('AutoTranslate_Enabled', true).then(() => {
					updatePermission('auto-translate', ['admin']).then(() => {
						request
							.post(api('autotranslate.translateMessage'))
							.set(credentials)
							.send({})
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((res) => {
								expect(res.body).to.have.a.property('success', false);
								expect(res.body.error).to.be.equal('The bodyParam "messageId" is required.');
							})
							.end(done);
					});
				});
			});
			it('should throw an error when the bodyParam "messageId" is invalid', (done) => {
				request
					.post(api('autotranslate.translateMessage'))
					.set(credentials)
					.send({
						messageId: 'invalid',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.error).to.be.equal('Message not found.');
					})
					.end(done);
			});
			it('should return success when the translate is sucessfull', (done) => {
				request
					.post(api('autotranslate.translateMessage'))
					.set(credentials)
					.send({
						messageId: messageSent._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
					})
					.end(done);
			});
		});
	});
});
