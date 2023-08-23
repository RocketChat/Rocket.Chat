import { expect } from 'chai';
import { after, before, beforeEach, describe, it } from 'mocha';

import { getCredentials, api, request, credentials, message } from '../../data/api-data.js';
import { sendSimpleMessage, deleteMessage, pinMessage } from '../../data/chat.helper.js';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom } from '../../data/rooms.helper.js';
import { password } from '../../data/user';
import { createUser, login } from '../../data/users.helper';

describe('[Chat]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('/chat.postMessage', () => {
		it('should throw an error when at least one of required parameters(channel, roomId) is not sent', (done) => {
			request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					text: 'Sample message',
					alias: 'Gruggy',
					emoji: ':smirk:',
					avatar: 'http://res.guggy.com/logo_128.png',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', '[invalid-channel]');
				})
				.end(done);
		});

		it('should throw an error when it has some properties with the wrong type(attachments.title_link_download, attachments.fields, message_link)', (done) => {
			request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					alias: 'Gruggy',
					text: 'Sample message',
					emoji: ':smirk:',
					avatar: 'http://res.guggy.com/logo_128.png',
					attachments: [
						{
							color: '#ff0000',
							text: 'Yay for gruggy!',
							ts: '2016-12-09T16:53:06.761Z',
							thumb_url: 'http://res.guggy.com/logo_128.png',
							message_link: 12,
							collapsed: false,
							author_name: 'Bradley Hilton',
							author_link: 'https://rocket.chat/',
							author_icon: 'https://avatars.githubusercontent.com/u/850391?v=3',
							title: 'Attachment Example',
							title_link: 'https://youtube.com',
							title_link_download: 'https://youtube.com',
							image_url: 'http://res.guggy.com/logo_128.png',
							audio_url: 'http://www.w3schools.com/tags/horse.mp3',
							video_url: 'http://www.w3schools.com/tags/movie.mp4',
							fields: '',
						},
					],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});

		describe('should throw an error when the sensitive properties contain malicious XSS values', () => {
			it('attachment.message_link', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						alias: 'Gruggy',
						text: 'Sample message',
						avatar: 'http://res.guggy.com/logo_128.png',
						emoji: ':smirk:',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								thumb_url: 'http://res.guggy.com/logo_128.png',
								message_link: 'javascript:alert("xss")',
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));

			it('attachment.author_link', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						text: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								thumb_url: 'http://res.guggy.com/logo_128.png',
								author_link: 'javascript:alert("xss")',
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));

			it('attachment.title_link', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						text: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								title: 'Attachment Example',
								title_link: 'javascript:alert("xss")',
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));

			it('attachment.action.url', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						text: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								title: 'Attachment Example',
								title_link: 'https://youtube.com',
								actions: [
									{
										type: 'button',
										text: 'Text',
										url: 'javascript:alert("xss")',
									},
								],
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));

			it('message.avatar', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						text: 'Sample message',
						emoji: ':smirk:',
						avatar: 'javascript:alert("xss")',
						alias: 'Gruggy',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								title: 'Attachment Example',
								title_link: 'https://youtube.com',
								actions: [
									{
										type: 'button',
										text: 'Text',
										url: 'https://youtube.com',
									},
								],
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));

			it('attachment.action.image_url', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						text: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								title: 'Attachment Example',
								title_link: 'https://youtube.com',
								actions: [
									{
										type: 'button',
										text: 'Text',
										url: 'http://res.guggy.com/logo_128.png',
										image_url: 'javascript:alert("xss")',
									},
								],
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));

			it('attachment.thumb_url', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						text: 'Sample message',
						emoji: ':smirk:',
						alias: 'Gruggy',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								title: 'Attachment Example',
								thumb_url: 'javascript:alert("xss")',
								title_link: 'http://res.guggy.com/logo_128.png',
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));

			it('attachment.author_icon', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						text: 'Sample message',
						emoji: ':smirk:',
						alias: 'Gruggy',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								title: 'Attachment Example',
								author_icon: 'javascript:alert("xss")',
								title_link: 'http://res.guggy.com/logo_128.png',
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));

			it('attachment.image_url', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						text: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								title: 'Attachment Example',
								image_url: 'javascript:alert("xss")',
								title_link: 'http://res.guggy.com/logo_128.png',
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));
			it('attachment.audio_url', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						text: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								title: 'Attachment Example',
								audio_url: 'javascript:alert("xss")',
								title_link: 'http://res.guggy.com/logo_128.png',
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));
			it('attachment.video_url', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						alias: 'Gruggy',
						text: 'Sample message',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								title: 'Attachment Example',
								video_url: 'javascript:alert("xss")',
								title_link: 'http://res.guggy.com/logo_128.png',
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));
		});

		it('should throw an error when the properties (attachments.fields.title, attachments.fields.value) are with the wrong type', (done) => {
			request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					text: 'Sample message',
					emoji: ':smirk:',
					alias: 'Gruggy',
					avatar: 'http://res.guggy.com/logo_128.png',
					attachments: [
						{
							color: '#ff0000',
							text: 'Yay for gruggy!',
							ts: '2016-12-09T16:53:06.761Z',
							thumb_url: 'http://res.guggy.com/logo_128.png',
							message_link: 'https://google.com',
							collapsed: false,
							author_name: 'Bradley Hilton',
							author_link: 'https://rocket.chat/',
							author_icon: 'https://avatars.githubusercontent.com/u/850391?v=3',
							title: 'Attachment Example',
							title_link: 'https://youtube.com',
							title_link_download: true,
							image_url: 'http://res.guggy.com/logo_128.png',
							audio_url: 'http://www.w3schools.com/tags/horse.mp3',
							video_url: 'http://www.w3schools.com/tags/movie.mp4',
							fields: [
								{
									short: true,
									title: 12,
									value: false,
								},
							],
						},
					],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});

		it('should return statusCode 200 when postMessage successfully', (done) => {
			request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					text: 'Sample message',
					emoji: ':smirk:',
					attachments: [
						{
							color: '#ff0000',
							text: 'Yay for gruggy!',
							ts: '2016-12-09T16:53:06.761Z',
							thumb_url: 'http://res.guggy.com/logo_128.png',
							message_link: 'https://google.com',
							collapsed: false,
							author_name: 'Bradley Hilton',
							author_link: 'https://rocket.chat/',
							author_icon: 'https://avatars.githubusercontent.com/u/850391?v=3',
							title: 'Attachment Example',
							title_link: 'https://youtube.com',
							title_link_download: true,
							image_url: 'http://res.guggy.com/logo_128.png',
							audio_url: 'http://www.w3schools.com/tags/horse.mp3',
							video_url: 'http://www.w3schools.com/tags/movie.mp4',
							fields: [
								{
									short: true,
									title: 'Test',
									value: 'Testing out something or other',
								},
								{
									short: true,
									title: 'Another Test',
									value: '[Link](https://google.com/) something and this and that.',
								},
							],
						},
					],
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', 'Sample message');
					message._id = res.body.message._id;
				})
				.end(done);
		});
	});

	describe('/chat.getMessage', () => {
		it('should retrieve the message successfully', (done) => {
			request
				.get(api('chat.getMessage'))
				.set(credentials)
				.query({
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message._id', message._id);
				})
				.end(done);
		});
	});

	describe('/chat.sendMessage', () => {
		it("should throw an error when the required param 'rid' is not sent", (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', "The 'rid' property on the message object is missing.");
				})
				.end(done);
		});

		describe('should throw an error when the sensitive properties contain malicious XSS values', () => {
			it('attachment.message_link', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						alias: 'Gruggy',
						text: 'Sample message',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								thumb_url: 'http://res.guggy.com/logo_128.png',
								message_link: 'javascript:alert("xss")',
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));

			it('attachment.author_link', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						text: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								thumb_url: 'http://res.guggy.com/logo_128.png',
								author_link: 'javascript:alert("xss")',
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));

			it('attachment.title_link', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						text: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								title: 'Attachment Example',
								title_link: 'javascript:alert("xss")',
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));

			it('attachment.action.url', () =>
				request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: 'general',
						text: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								title: 'Attachment Example',
								title_link: 'https://youtube.com',
								actions: [
									{
										type: 'button',
										text: 'Text',
										url: 'javascript:alert("xss")',
									},
								],
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					}));
		});

		it('should throw an error when it has some properties with the wrong type(attachments.title_link_download, attachments.fields, message_link)', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						channel: 'general',
						text: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								thumb_url: 'http://res.guggy.com/logo_128.png',
								message_link: 12,
								collapsed: false,
								author_name: 'Bradley Hilton',
								author_link: 'https://rocket.chat/',
								author_icon: 'https://avatars.githubusercontent.com/u/850391?v=3',
								title: 'Attachment Example',
								title_link: 'https://youtube.com',
								title_link_download: 'https://youtube.com',
								image_url: 'http://res.guggy.com/logo_128.png',
								audio_url: 'http://www.w3schools.com/tags/horse.mp3',
								video_url: 'http://www.w3schools.com/tags/movie.mp4',
								fields: '',
							},
						],
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});

		it('should send a message successfully', (done) => {
			message._id = `id-${Date.now()}`;
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						_id: message._id,
						rid: 'GENERAL',
						msg: 'Sample message',
						emoji: ':smirk:',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay for gruggy!',
								ts: '2016-12-09T16:53:06.761Z',
								thumb_url: 'http://res.guggy.com/logo_128.png',
								message_link: 'https://google.com',
								collapsed: false,
								author_name: 'Bradley Hilton',
								author_link: 'https://rocket.chat/',
								author_icon: 'https://avatars.githubusercontent.com/u/850391?v=3',
								title: 'Attachment Example',
								title_link: 'https://youtube.com',
								title_link_download: true,
								image_url: 'http://res.guggy.com/logo_128.png',
								audio_url: 'http://www.w3schools.com/tags/horse.mp3',
								video_url: 'http://www.w3schools.com/tags/movie.mp4',
								fields: [
									{
										short: true,
										title: 'Test',
										value: 'Testing out something or other',
									},
									{
										short: true,
										title: 'Another Test',
										value: '[Link](https://google.com/) something and this and that.',
									},
								],
							},
						],
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', 'Sample message');
				})
				.end(done);
		});

		describe('oembed', () => {
			let ytEmbedMsgId;
			let imgUrlMsgId;

			before(async () => {
				await Promise.all([updateSetting('API_EmbedIgnoredHosts', ''), updateSetting('API_EmbedSafePorts', '80, 443, 3000')]);
			});
			after(async () => {
				await Promise.all([
					updateSetting('API_EmbedIgnoredHosts', 'localhost, 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16'),
					updateSetting('API_EmbedSafePorts', '80, 443'),
				]);
			});

			before(async () => {
				const ytEmbedMsgPayload = {
					_id: `id-${Date.now()}`,
					rid: 'GENERAL',
					msg: 'https://www.youtube.com/watch?v=T2v29gK8fP4',
					emoji: ':smirk:',
				};
				const ytPostResponse = await request.post(api('chat.sendMessage')).set(credentials).send({ message: ytEmbedMsgPayload });
				ytEmbedMsgId = ytPostResponse.body.message._id;
			});

			before(async () => {
				const imgUrlMsgPayload = {
					_id: `id-${Date.now()}1`,
					rid: 'GENERAL',
					msg: 'http://localhost:3000/images/logo/logo.png',
					emoji: ':smirk:',
				};

				const imgUrlResponse = await request.post(api('chat.sendMessage')).set(credentials).send({ message: imgUrlMsgPayload });

				imgUrlMsgId = imgUrlResponse.body.message._id;
			});

			it('should have an iframe oembed with style max-width', (done) => {
				setTimeout(() => {
					request
						.get(api('chat.getMessage'))
						.set(credentials)
						.query({
							msgId: ytEmbedMsgId,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('message').to.have.property('urls').to.be.an('array').that.is.not.empty;

							expect(res.body.message.urls[0])
								.to.have.property('meta')
								.to.have.property('oembedHtml')
								.to.have.string('<iframe style="max-width: 100%;width:400px;height:225px"');
						})
						.end(done);
				}, 1000);
			});

			it('should embed an image preview if message has an image url', (done) => {
				setTimeout(() => {
					request
						.get(api('chat.getMessage'))
						.set(credentials)
						.query({
							msgId: imgUrlMsgId,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('message').to.have.property('urls').to.be.an('array').that.is.not.empty;

							expect(res.body.message.urls[0]).to.have.property('headers').to.have.property('contentType', 'image/png');
						})
						.end(done);
				}, 200);
			});
		});

		describe('Read only channel', () => {
			let readOnlyChannel;

			const userCredentials = {};
			let user;
			before((done) => {
				const username = `user.test.readonly.${Date.now()}`;
				const email = `${username}@rocket.chat`;
				request
					.post(api('users.create'))
					.set(credentials)
					.send({ email, name: username, username, password })
					.end((err, res) => {
						user = res.body.user;
						request
							.post(api('login'))
							.send({
								user: username,
								password,
							})
							.expect('Content-Type', 'application/json')
							.expect(200)
							.expect((res) => {
								userCredentials['X-Auth-Token'] = res.body.data.authToken;
								userCredentials['X-User-Id'] = res.body.data.userId;
							})
							.end(done);
					});
			});

			it('Creating a read-only channel', (done) => {
				request
					.post(api('channels.create'))
					.set(credentials)
					.send({
						name: `readonlychannel${+new Date()}`,
						readOnly: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						readOnlyChannel = res.body.channel;
					})
					.end(done);
			});
			it('should send a message when the user is the owner of a readonly channel', (done) => {
				request
					.post(api('chat.sendMessage'))
					.set(credentials)
					.send({
						message: {
							rid: readOnlyChannel._id,
							msg: 'Sample message',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('message').and.to.be.an('object');
					})
					.end(done);
			});
			it('Inviting regular user to read-only channel', (done) => {
				request
					.post(api('channels.invite'))
					.set(credentials)
					.send({
						roomId: readOnlyChannel._id,
						userId: user._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(() => {
						done();
					});
			});

			it('should fail to send message when the user lacks permission', (done) => {
				request
					.post(api('chat.sendMessage'))
					.set(userCredentials)
					.send({
						message: {
							rid: readOnlyChannel._id,
							msg: 'Sample blocked message',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					})
					.end(done);
			});

			it('should send a message when the user has permission to send messages on readonly channels', async () => {
				await updatePermission('post-readonly', ['user']);

				await request
					.post(api('chat.sendMessage'))
					.set(userCredentials)
					.send({
						message: {
							rid: readOnlyChannel._id,
							msg: 'Sample message overwriting readonly status',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('message').and.to.be.an('object');
					});

				await updatePermission('post-readonly', ['admin', 'owner', 'moderator']);
			});
		});

		it('should fail if user does not have the message-impersonate permission and tries to send message with alias param', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						rid: 'GENERAL',
						msg: 'Sample message',
						alias: 'Gruggy',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Not enough permission');
				})
				.end(done);
		});

		it('should fail if user does not have the message-impersonate permission and tries to send message with avatar param', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						rid: 'GENERAL',
						msg: 'Sample message',
						avatar: 'http://site.com/logo.png',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Not enough permission');
				})
				.end(done);
		});
	});

	describe('/chat.update', () => {
		it('should update a message successfully', (done) => {
			request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
					msgId: message._id,
					text: 'This message was edited via API',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', 'This message was edited via API');
				})
				.end(done);
		});
	});

	describe('[/chat.delete]', () => {
		let msgId;
		let user;
		let userCredentials;
		before((done) => {
			const username = `user.test.${Date.now()}`;
			const email = `${username}@rocket.chat`;
			request
				.post(api('users.create'))
				.set(credentials)
				.send({ email, name: username, username, password })
				.end((err, res) => {
					user = res.body.user;
					done();
				});
		});
		before((done) => {
			request
				.post(api('login'))
				.send({
					user: user.username,
					password,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					userCredentials = {};
					userCredentials['X-Auth-Token'] = res.body.data.authToken;
					userCredentials['X-User-Id'] = res.body.data.userId;
				})
				.end(done);
		});
		after((done) => {
			request
				.post(api('users.delete'))
				.set(credentials)
				.send({
					userId: user._id,
				})
				.end(() => {
					user = undefined;
					done();
				});
		});
		beforeEach((done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						rid: 'GENERAL',
						msg: 'Sample message',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					msgId = res.body.message._id;
				})
				.end(done);
		});
		it('should delete a message successfully', (done) => {
			request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
					msgId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('sending message as another user...', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(userCredentials)
				.send({
					message: {
						rid: 'GENERAL',
						msg: 'Sample message',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					msgId = res.body.message._id;
				})
				.end(done);
		});
		it('should delete a message successfully when the user deletes a message send by another user', (done) => {
			request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
					msgId,
					asUser: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/chat.search', () => {
		before(async () => {
			const sendMessage = (text) =>
				request
					.post(api('chat.sendMessage'))
					.set(credentials)
					.send({
						message: {
							rid: 'GENERAL',
							msg: text,
						},
					});

			await sendMessage('msg1');
			await sendMessage('msg1');
			await sendMessage('msg1');
			await sendMessage('msg1');
			await sendMessage('msg1');
		});

		it('should return a list of messages when execute successfully', (done) => {
			request
				.get(api('chat.search'))
				.set(credentials)
				.query({
					roomId: 'GENERAL',
					searchText: 'msg1',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages');
				})
				.end(done);
		});
		it('should return a list of messages(length=1) when is provided "count" query parameter execute successfully', (done) => {
			request
				.get(api('chat.search'))
				.set(credentials)
				.query({
					roomId: 'GENERAL',
					searchText: 'msg1',
					count: 1,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages');
					expect(res.body.messages.length).to.equal(1);
				})
				.end(done);
		});
		it('should return a list of messages(length=3) when is provided "count" and "offset" query parameters are executed successfully', (done) => {
			request
				.get(api('chat.search'))
				.set(credentials)
				.query({
					roomId: 'GENERAL',
					searchText: 'msg1',
					offset: 1,
					count: 3,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages');
					expect(res.body.messages.length).to.equal(3);
				})
				.end(done);
		});

		it('should return a empty list of messages when is provided a huge offset value', (done) => {
			request
				.get(api('chat.search'))
				.set(credentials)
				.query({
					roomId: 'GENERAL',
					searchText: 'msg1',
					offset: 9999,
					count: 3,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages');
					expect(res.body.messages.length).to.equal(0);
				})
				.end(done);
		});
	});

	describe('[/chat.react]', () => {
		it("should return statusCode: 200 and success when try unreact a message that's no reacted yet", (done) => {
			request
				.post(api('chat.react'))
				.set(credentials)
				.send({
					emoji: ':squid:',
					messageId: message._id,
					shouldReact: false,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should react a message successfully', (done) => {
			request
				.post(api('chat.react'))
				.set(credentials)
				.send({
					emoji: 'smile',
					messageId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should return statusCode: 200 when the emoji is valid', (done) => {
			request
				.post(api('chat.react'))
				.set(credentials)
				.send({
					emoji: ':squid:',
					messageId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it("should return statusCode: 200 and success when try react a message that's already reacted", (done) => {
			request
				.post(api('chat.react'))
				.set(credentials)
				.send({
					emoji: ':squid:',
					messageId: message._id,
					shouldReact: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should return statusCode: 200 when unreact a message with flag, shouldReact: false', (done) => {
			request
				.post(api('chat.react'))
				.set(credentials)
				.send({
					emoji: ':squid:',
					messageId: message._id,
					shouldReact: false,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should return statusCode: 200 when react a message with flag, shouldReact: true', (done) => {
			request
				.post(api('chat.react'))
				.set(credentials)
				.send({
					emoji: ':squid:',
					messageId: message._id,
					shouldReact: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should return statusCode: 200 when the emoji is valid and has no colons', (done) => {
			request
				.post(api('chat.react'))
				.set(credentials)
				.send({
					emoji: 'bee',
					messageId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should return statusCode: 200 for reaction property when the emoji is valid', (done) => {
			request
				.post(api('chat.react'))
				.set(credentials)
				.send({
					reaction: 'ant',
					messageId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('[/chat.getMessageReadReceipts]', () => {
		const isEnterprise = typeof process.env.IS_EE === 'string' ? process.env.IS_EE === 'true' : !!process.env.IS_EE;
		describe('when execute successfully', () => {
			it('should return statusCode: 200 and an array of receipts when running EE', function (done) {
				if (!isEnterprise) {
					this.skip();
				}

				request
					.get(api(`chat.getMessageReadReceipts`))
					.set(credentials)
					.query({
						messageId: message._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('receipts').and.to.be.an('array');
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});

		describe('when an error occurs', () => {
			it('should throw error-action-not-allowed error when not running EE', function (done) {
				// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
				// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
				if (isEnterprise) {
					this.skip();
				}
				request
					.get(api(`chat.getMessageReadReceipts`))
					.set(credentials)
					.query({
						messageId: message._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'This is an enterprise feature [error-action-not-allowed]');
						expect(res.body).to.have.property('errorType', 'error-action-not-allowed');
					})
					.end(done);
			});

			it('should return statusCode: 400 and an error when no messageId is provided', function (done) {
				if (!isEnterprise) {
					this.skip();
				}

				request
					.get(api('chat.getMessageReadReceipts'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).not.have.property('receipts');
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					})
					.end(done);
			});
		});
	});

	describe('[/chat.reportMessage]', () => {
		describe('when execute successfully', () => {
			it('should return the statusCode 200', (done) => {
				request
					.post(api('chat.reportMessage'))
					.set(credentials)
					.send({
						messageId: message._id,
						description: 'test',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});

		describe('when an error occurs', () => {
			it('should return statusCode 400 and an error', (done) => {
				request
					.post(api('chat.reportMessage'))
					.set(credentials)
					.send({
						messageId: message._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					})
					.end(done);
			});
		});
	});

	describe('[/chat.getDeletedMessages]', () => {
		let roomId;
		before((done) => {
			createRoom({
				type: 'c',
				name: `channel.test.${Date.now()}`,
			}).end((err, res) => {
				roomId = res.body.channel._id;
				sendSimpleMessage({ roomId }).end((err, res) => {
					const msgId = res.body.message._id;
					deleteMessage({ roomId, msgId }).end(done);
				});
			});
		});

		describe('when execute successfully', () => {
			it('should return a list of deleted messages', (done) => {
				request
					.get(api('chat.getDeletedMessages'))
					.set(credentials)
					.query({
						roomId,
						since: new Date('20 December 2018 17:51 UTC').toISOString(),
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('messages').and.to.be.an('array');
						expect(res.body.messages.length).to.be.equal(1);
					})
					.end(done);
			});
			it('should return a list of deleted messages when the user sets count query parameter', (done) => {
				request
					.get(api('chat.getDeletedMessages'))
					.set(credentials)
					.query({
						roomId,
						since: new Date('20 December 2018 17:51 UTC').toISOString(),
						count: 1,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('messages').and.to.be.an('array');
						expect(res.body.messages.length).to.be.equal(1);
					})
					.end(done);
			});
			it('should return a list of deleted messages when the user sets count and offset query parameters', (done) => {
				request
					.get(api('chat.getDeletedMessages'))
					.set(credentials)
					.query({
						roomId,
						since: new Date('20 December 2018 17:51 UTC').toISOString(),
						count: 1,
						offset: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('messages').and.to.be.an('array');
						expect(res.body.messages.length).to.be.equal(1);
					})
					.end(done);
			});
		});

		describe('when an error occurs', () => {
			it('should return statusCode 400 and an error when "roomId" is not provided', (done) => {
				request
					.get(api('chat.getDeletedMessages'))
					.set(credentials)
					.query({
						since: new Date('20 December 2018 17:51 UTC').toISOString(),
						count: 1,
						offset: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.errorType).to.be.equal('The required "roomId" query param is missing.');
					})
					.end(done);
			});
			it('should return statusCode 400 and an error when "since" is not provided', (done) => {
				request
					.get(api('chat.getDeletedMessages'))
					.set(credentials)
					.query({
						roomId,
						count: 1,
						offset: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.errorType).to.be.equal('The required "since" query param is missing.');
					})
					.end(done);
			});
			it('should return statusCode 400 and an error when "since" is provided but it is invalid ISODate', (done) => {
				request
					.get(api('chat.getDeletedMessages'))
					.set(credentials)
					.query({
						roomId,
						since: 'InvalidaDate',
						count: 1,
						offset: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.errorType).to.be.equal('The "since" query parameter must be a valid date.');
					})
					.end(done);
			});
		});
	});

	describe('[/chat.pinMessage]', () => {
		it('should return an error when pinMessage is not allowed in this server', (done) => {
			updateSetting('Message_AllowPinning', false).then(() => {
				request
					.post(api('chat.pinMessage'))
					.set(credentials)
					.send({
						messageId: message._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					})
					.end(done);
			});
		});

		it('should return an error when pinMessage is allowed in server but user dont have permission', (done) => {
			updateSetting('Message_AllowPinning', true).then(() => {
				updatePermission('pin-message', []).then(() => {
					request
						.post(api('chat.pinMessage'))
						.set(credentials)
						.send({
							messageId: message._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error');
						})
						.end(done);
				});
			});
		});

		it('should pin Message successfully', (done) => {
			updatePermission('pin-message', ['admin']).then(() => {
				request
					.post(api('chat.pinMessage'))
					.set(credentials)
					.send({
						messageId: message._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.not.have.property('error');
					})
					.end(done);
			});
		});
	});

	describe('[/chat.unPinMessage]', () => {
		it('should return an error when pinMessage is not allowed in this server', (done) => {
			updateSetting('Message_AllowPinning', false).then(() => {
				request
					.post(api('chat.unPinMessage'))
					.set(credentials)
					.send({
						messageId: message._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					})
					.end(done);
			});
		});

		it('should return an error when pinMessage is allowed in server but users dont have permission', (done) => {
			updateSetting('Message_AllowPinning', true).then(() => {
				updatePermission('pin-message', []).then(() => {
					request
						.post(api('chat.unPinMessage'))
						.set(credentials)
						.send({
							messageId: message._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error');
						})
						.end(done);
				});
			});
		});

		it('should unpin Message successfully', (done) => {
			updatePermission('pin-message', ['admin']).then(() => {
				request
					.post(api('chat.unPinMessage'))
					.set(credentials)
					.send({
						messageId: message._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.not.have.property('error');
					})
					.end(done);
			});
		});
	});

	describe('[/chat.unStarMessage]', () => {
		it('should return an error when starMessage is not allowed in this server', (done) => {
			updateSetting('Message_AllowStarring', false).then(() => {
				request
					.post(api('chat.unStarMessage'))
					.set(credentials)
					.send({
						messageId: message._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					})
					.end(done);
			});
		});

		it('should unstar Message successfully', (done) => {
			updateSetting('Message_AllowStarring', true).then(() => {
				request
					.post(api('chat.unStarMessage'))
					.set(credentials)
					.send({
						messageId: message._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.not.have.property('error');
					})
					.end(done);
			});
		});
	});

	describe('[/chat.starMessage]', () => {
		it('should return an error when starMessage is not allowed in this server', (done) => {
			updateSetting('Message_AllowStarring', false).then(() => {
				request
					.post(api('chat.starMessage'))
					.set(credentials)
					.send({
						messageId: message._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					})
					.end(done);
			});
		});

		it('should star Message successfully', (done) => {
			updateSetting('Message_AllowStarring', true).then(() => {
				request
					.post(api('chat.starMessage'))
					.set(credentials)
					.send({
						messageId: message._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.not.have.property('error');
					})
					.end(done);
			});
		});
	});

	describe('[/chat.ignoreUser]', () => {
		it('should fail if invalid roomId', (done) => {
			request
				.get(api('chat.ignoreUser'))
				.set(credentials)
				.query({
					rid: 'invalid',
					userId: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-subscription');
				})
				.end(() => {
					done();
				});
		});
		it('should fail if invalid userId', (done) => {
			request
				.get(api('chat.ignoreUser'))
				.set(credentials)
				.query({
					rid: 'rocket.catrocketchat.internal.admin.test',
					userId: 'invalid',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-subscription');
				})
				.end(() => {
					done();
				});
		});
		it('should successfully ignore user', (done) => {
			request
				.get(api('chat.ignoreUser'))
				.set(credentials)
				.query({
					rid: 'rocket.catrocketchat.internal.admin.test',
					userId: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(() => {
					done();
				});
		});
		it('should successfully unignore user', (done) => {
			request
				.get(api('chat.ignoreUser'))
				.set(credentials)
				.query({
					rid: 'rocket.catrocketchat.internal.admin.test',
					userId: 'rocket.cat',
					ignore: false,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(() => {
					done();
				});
		});
	});

	describe('[/chat.getPinnedMessages]', () => {
		let roomId;
		before((done) => {
			createRoom({
				type: 'c',
				name: `channel.test.${Date.now()}`,
			}).end((err, res) => {
				roomId = res.body.channel._id;
				sendSimpleMessage({ roomId }).end((err, res) => {
					const msgId = res.body.message._id;
					pinMessage({ msgId }).end(done);
				});
			});
		});

		describe('when execute successfully', () => {
			it('should return a list of pinned messages', (done) => {
				request
					.get(api('chat.getPinnedMessages'))
					.set(credentials)
					.query({
						roomId,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('messages').and.to.be.an('array');
						expect(res.body.messages.length).to.be.equal(1);
					})
					.end(done);
			});
			it('should return a list of pinned messages when the user sets count query parameter', (done) => {
				request
					.get(api('chat.getPinnedMessages'))
					.set(credentials)
					.query({
						roomId,
						count: 1,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('messages').and.to.be.an('array');
						expect(res.body.messages.length).to.be.equal(1);
					})
					.end(done);
			});
			it('should return a list of pinned messages when the user sets count and offset query parameters', (done) => {
				request
					.get(api('chat.getPinnedMessages'))
					.set(credentials)
					.query({
						roomId,
						count: 1,
						offset: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('messages').and.to.be.an('array');
						expect(res.body.messages.length).to.be.equal(1);
					})
					.end(done);
			});
		});

		describe('when an error occurs', () => {
			it('should return statusCode 400 and an error when "roomId" is not provided', (done) => {
				request
					.get(api('chat.getPinnedMessages'))
					.set(credentials)
					.query({
						count: 1,
						offset: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.errorType).to.be.equal('error-roomId-param-not-provided');
					})
					.end(done);
			});
		});
	});

	describe('[/chat.getMentionedMessages]', () => {
		it('should return an error when the required "roomId" parameter is not sent', (done) => {
			request
				.get(api('chat.getMentionedMessages'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-invalid-params');
				})
				.end(done);
		});

		it('should return an error when the roomId is invalid', (done) => {
			request
				.get(api('chat.getMentionedMessages?roomId=invalid-room'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('error-not-allowed');
				})
				.end(done);
		});

		it('should return the mentioned messages', (done) => {
			request
				.get(api('chat.getMentionedMessages?roomId=GENERAL'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
	});

	describe('[/chat.getStarredMessages]', () => {
		it('should return an error when the required "roomId" parameter is not sent', (done) => {
			request
				.get(api('chat.getStarredMessages'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-invalid-params');
				})
				.end(done);
		});

		it('should return an error when the roomId is invalid', (done) => {
			request
				.get(api('chat.getStarredMessages?roomId=invalid-room'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('error-not-allowed');
				})
				.end(done);
		});

		it('should return the starred messages', (done) => {
			request
				.get(api('chat.getStarredMessages?roomId=GENERAL'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
	});

	describe('[/chat.getDiscussions]', () => {
		const messageText = 'Message to create discussion';
		let testChannel;
		let discussionRoom;
		const messageWords = [
			...messageText.split(' '),
			...messageText.toUpperCase().split(' '),
			...messageText.toLowerCase().split(' '),
			messageText,
			messageText.charAt(0),
			' ',
		];
		before((done) => {
			createRoom({ type: 'c', name: `channel.test.threads.${Date.now()}` }).end((err, room) => {
				testChannel = room.body.channel;
				request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({
						prid: testChannel._id,
						t_name: 'Message to create discussion',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.end((err, res) => {
						discussionRoom = res.body.discussion;
						done();
					});
			});
		});

		it('should return an error when the required "roomId" parameter is not sent', (done) => {
			request
				.get(api('chat.getDiscussions'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-invalid-params');
				})
				.end(done);
		});

		it('should return an error when the roomId is invalid', (done) => {
			request
				.get(api('chat.getDiscussions?roomId=invalid-room'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('error-not-allowed');
				})
				.end(done);
		});

		it('should return the discussions of a room', (done) => {
			request
				.get(api('chat.getDiscussions?roomId=GENERAL'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should return the discussions of a room even requested with count and offset params', (done) => {
			request
				.get(api('chat.getDiscussions'))
				.set(credentials)
				.query({
					roomId: 'GENERAL',
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});

		function filterDiscussionsByText(text) {
			it(`should return the room's discussion list filtered by the text '${text}'`, (done) => {
				request
					.get(api('chat.getDiscussions'))
					.set(credentials)
					.query({
						roomId: testChannel._id,
						text,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('messages').and.to.be.an('array');
						expect(res.body).to.have.property('total');
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('count');
						expect(res.body.messages).to.have.lengthOf(1);
						expect(res.body.messages[0].drid).to.be.equal(discussionRoom.rid);
					})
					.end(done);
			});

			it(`should return the room's discussion list filtered by the text '${text}' even requested with count and offset params`, (done) => {
				request
					.get(api('chat.getDiscussions'))
					.set(credentials)
					.query({
						roomId: testChannel._id,
						text,
						count: 5,
						offset: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('messages').and.to.be.an('array');
						expect(res.body).to.have.property('total');
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('count');
						expect(res.body.messages).to.have.lengthOf(1);
						expect(res.body.messages[0].drid).to.be.equal(discussionRoom.rid);
					})
					.end(done);
			});
		}

		messageWords.forEach((text) => {
			filterDiscussionsByText(text);
		});
	});
});

describe('Threads', () => {
	after((done) => {
		updateSetting('API_Upper_Count_Limit', 100)
			.then(() => updatePermission('view-c-room', ['admin', 'user', 'bot']))
			.then(done);
	});

	describe('[/chat.getThreadsList]', () => {
		const messageText = 'Message to create thread';
		let testChannel;
		let threadMessage;
		const messageWords = [
			...messageText.split(' '),
			...messageText.toUpperCase().split(' '),
			...messageText.toLowerCase().split(' '),
			messageText,
			messageText.charAt(0),
			' ',
		];
		before((done) => {
			createRoom({ type: 'c', name: `channel.test.threads.${Date.now()}` }).end((err, room) => {
				testChannel = room.body.channel;
				request
					.post(api('chat.sendMessage'))
					.set(credentials)
					.send({
						message: {
							rid: testChannel._id,
							msg: 'Message to create thread',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.then((response) => {
						request
							.post(api('chat.sendMessage'))
							.set(credentials)
							.send({
								message: {
									rid: testChannel._id,
									msg: 'Thread message',
									tmid: response.body.message._id,
								},
							})
							.expect('Content-Type', 'application/json')
							.expect(200)
							.end((err, res) => {
								threadMessage = res.body.message;
								done();
							});
					});
			});
		});

		it('should return an error for chat.getThreadsList when threads are not allowed in this server', (done) => {
			updateSetting('Threads_enabled', false).then(() => {
				request
					.get(api('chat.getThreadsList'))
					.set(credentials)
					.query({
						rid: testChannel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-not-allowed');
						expect(res.body).to.have.property('error', 'Threads Disabled [error-not-allowed]');
					})
					.end(done);
			});
		});

		it('should return an error when the user is not allowed access the room', (done) => {
			createUser().then((createdUser) => {
				login(createdUser.username, password).then((userCredentials) => {
					updateSetting('Threads_enabled', true).then(() => {
						updatePermission('view-c-room', []).then(() => {
							request
								.get(api('chat.getThreadsList'))
								.set(userCredentials)
								.query({
									rid: testChannel._id,
								})
								.expect('Content-Type', 'application/json')
								.expect(400)
								.expect((res) => {
									expect(res.body).to.have.property('success', false);
									expect(res.body).to.have.property('errorType', 'error-not-allowed');
									expect(res.body).to.have.property('error', 'Not Allowed [error-not-allowed]');
								})
								.end(done);
						});
					});
				});
			});
		});

		it("should return the room's thread list", (done) => {
			updatePermission('view-c-room', ['admin', 'user']).then(() => {
				request
					.get(api('chat.getThreadsList'))
					.set(credentials)
					.query({
						rid: testChannel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('threads').and.to.be.an('array');
						expect(res.body).to.have.property('total');
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('count');
						expect(res.body.threads).to.have.lengthOf(1);
						expect(res.body.threads[0]._id).to.be.equal(threadMessage.tmid);
					})
					.end(done);
			});
		});

		it("should return the room's thread list even requested with count and offset params", (done) => {
			updatePermission('view-c-room', ['admin', 'user']).then(() => {
				request
					.get(api('chat.getThreadsList'))
					.set(credentials)
					.query({
						rid: testChannel._id,
						count: 5,
						offset: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('threads').and.to.be.an('array');
						expect(res.body).to.have.property('total');
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('count');
						expect(res.body.threads).to.have.lengthOf(1);
						expect(res.body.threads[0]._id).to.be.equal(threadMessage.tmid);
					})
					.end(done);
			});
		});

		function filterThreadsByText(text) {
			it(`should return the room's thread list filtered by the text '${text}'`, (done) => {
				request
					.get(api('chat.getThreadsList'))
					.set(credentials)
					.query({
						rid: testChannel._id,
						text,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('threads').and.to.be.an('array');
						expect(res.body).to.have.property('total');
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('count');
						expect(res.body.threads).to.have.lengthOf(1);
						expect(res.body.threads[0]._id).to.be.equal(threadMessage.tmid);
					})
					.end(done);
			});
			it(`should return the room's thread list filtered by the text '${text}' even requested with count and offset params`, (done) => {
				request
					.get(api('chat.getThreadsList'))
					.set(credentials)
					.query({
						rid: testChannel._id,
						text,
						count: 5,
						offset: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('threads').and.to.be.an('array');
						expect(res.body).to.have.property('total');
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('count');
						expect(res.body.threads).to.have.lengthOf(1);
						expect(res.body.threads[0]._id).to.be.equal(threadMessage.tmid);
					})
					.end(done);
			});
		}

		messageWords.forEach((text) => {
			filterThreadsByText(text);
		});

		it('should return an empty thread list', (done) => {
			updatePermission('view-c-room', ['admin', 'user']).then(() => {
				request
					.get(api('chat.getThreadsList'))
					.set(credentials)
					.query({
						rid: testChannel._id,
						text: 'missing',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('threads').and.to.be.an('array');
						expect(res.body).to.have.property('total');
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('count');
						expect(res.body.threads).to.have.lengthOf(0);
					})
					.end(done);
			});
		});
	});

	describe('[/chat.syncThreadsList]', () => {
		let testChannel;
		let threadMessage;
		before((done) => {
			createRoom({ type: 'c', name: `.threads.sync.${Date.now()}` }).end((err, channel) => {
				testChannel = channel.body.channel;
				sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Message to create thread',
				}).end((err, message) => {
					sendSimpleMessage({
						roomId: testChannel._id,
						text: 'Thread Message',
						tmid: message.body.message._id,
					}).end((err, res) => {
						threadMessage = res.body.message;
						done();
					});
				});
			});
		});

		it('should return an error for chat.getThreadsList when threads are not allowed in this server', (done) => {
			updateSetting('Threads_enabled', false).then(() => {
				request
					.get(api('chat.getThreadsList'))
					.set(credentials)
					.query({
						rid: testChannel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-not-allowed');
						expect(res.body).to.have.property('error', 'Threads Disabled [error-not-allowed]');
					})
					.end(done);
			});
		});

		it('should return an error when the required param "rid" is missing', (done) => {
			updateSetting('Threads_enabled', true).then(() => {
				request
					.get(api('chat.syncThreadsList'))
					.set(credentials)
					.query({})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-room-id-param-not-provided');
						expect(res.body).to.have.property('error', 'The required "rid" query param is missing. [error-room-id-param-not-provided]');
					})
					.end(done);
			});
		});

		it('should return an error when the required param "updatedSince" is missing', (done) => {
			updateSetting('Threads_enabled', true).then(() => {
				request
					.get(api('chat.syncThreadsList'))
					.set(credentials)
					.query({
						rid: testChannel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-updatedSince-param-invalid');
						expect(res.body).to.have.property('error', 'The required param "updatedSince" is missing. [error-updatedSince-param-invalid]');
					})
					.end(done);
			});
		});

		it('should return an error when the param "updatedSince" is an invalid date', (done) => {
			updateSetting('Threads_enabled', true).then(() => {
				request
					.get(api('chat.syncThreadsList'))
					.set(credentials)
					.query({
						rid: testChannel._id,
						updatedSince: 'invalid-date',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-updatedSince-param-invalid');
						expect(res.body).to.have.property(
							'error',
							'The "updatedSince" query parameter must be a valid date. [error-updatedSince-param-invalid]',
						);
					})
					.end(done);
			});
		});

		it('should return an error when the user is not allowed access the room', (done) => {
			createUser().then((createdUser) => {
				login(createdUser.username, password).then((userCredentials) => {
					updatePermission('view-c-room', []).then(() => {
						request
							.get(api('chat.syncThreadsList'))
							.set(userCredentials)
							.query({
								rid: testChannel._id,
								updatedSince: new Date().toISOString(),
							})
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((res) => {
								expect(res.body).to.have.property('success', false);
								expect(res.body).to.have.property('errorType', 'error-not-allowed');
								expect(res.body).to.have.property('error', 'Not Allowed [error-not-allowed]');
							})
							.end(done);
					});
				});
			});
		});

		it("should return the room's thread synced list", (done) => {
			updatePermission('view-c-room', ['admin', 'user']).then(() => {
				request
					.get(api('chat.syncThreadsList'))
					.set(credentials)
					.query({
						rid: testChannel._id,
						updatedSince: new Date('2019-04-01').toISOString(),
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('threads').and.to.be.an('object');
						expect(res.body.threads).to.have.property('update').and.to.be.an('array');
						expect(res.body.threads).to.have.property('remove').and.to.be.an('array');
						expect(res.body.threads.update).to.have.lengthOf(1);
						expect(res.body.threads.remove).to.have.lengthOf(0);
						expect(res.body.threads.update[0]._id).to.be.equal(threadMessage.tmid);
					})
					.end(done);
			});
		});
	});

	describe('[/chat.getThreadMessages]', () => {
		let testChannel;
		let threadMessage;
		let createdThreadMessage;
		before((done) => {
			createRoom({ type: 'c', name: `channel.test.threads.${Date.now()}` }).end((err, res) => {
				testChannel = res.body.channel;
				sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Message to create thread',
				}).end((err, message) => {
					createdThreadMessage = message.body.message;
					sendSimpleMessage({
						roomId: testChannel._id,
						text: 'Thread Message',
						tmid: createdThreadMessage._id,
					}).end((err, res) => {
						threadMessage = res.body.message;
						done();
					});
				});
			});
		});

		it('should return an error for chat.getThreadMessages when threads are not allowed in this server', (done) => {
			updateSetting('Threads_enabled', false).then(() => {
				request
					.get(api('chat.getThreadMessages'))
					.set(credentials)
					.query({
						tmid: threadMessage.tmid,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-not-allowed');
						expect(res.body).to.have.property('error', 'Threads Disabled [error-not-allowed]');
					})
					.end(done);
			});
		});

		it('should return an error when the user is not allowed access the room', (done) => {
			createUser().then((createdUser) => {
				login(createdUser.username, password).then((userCredentials) => {
					updateSetting('Threads_enabled', true).then(() => {
						updatePermission('view-c-room', []).then(() => {
							request
								.get(api('chat.getThreadMessages'))
								.set(userCredentials)
								.query({
									tmid: threadMessage.tmid,
								})
								.expect('Content-Type', 'application/json')
								.expect(400)
								.expect((res) => {
									expect(res.body).to.have.property('success', false);
									expect(res.body).to.have.property('errorType', 'error-not-allowed');
									expect(res.body).to.have.property('error', 'Not Allowed [error-not-allowed]');
								})
								.end(done);
						});
					});
				});
			});
		});

		it("should return the thread's message list", (done) => {
			updatePermission('view-c-room', ['admin', 'user']).then(() => {
				request
					.get(api('chat.getThreadMessages'))
					.set(credentials)
					.query({
						tmid: threadMessage.tmid,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('messages').and.to.be.an('array');
						expect(res.body).to.have.property('total').and.to.be.equal(1);
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('count');
						expect(res.body.messages).to.have.lengthOf(1);
						expect(res.body.messages[0].tmid).to.be.equal(createdThreadMessage._id);
					})
					.end(done);
			});
		});
	});

	describe('[/chat.syncThreadMessages]', () => {
		let testChannel;
		let threadMessage;
		let createdThreadMessage;
		before((done) => {
			createRoom({ type: 'c', name: `message.threads.${Date.now()}` }).end((err, res) => {
				testChannel = res.body.channel;
				sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Message to create thread',
				}).end((err, message) => {
					createdThreadMessage = message.body.message;
					sendSimpleMessage({
						roomId: testChannel._id,
						text: 'Thread Message',
						tmid: createdThreadMessage._id,
					}).end((err, res) => {
						threadMessage = res.body.message;
						done();
					});
				});
			});
		});

		it('should return an error for chat.syncThreadMessages when threads are not allowed in this server', (done) => {
			updateSetting('Threads_enabled', false).then(() => {
				request
					.get(api('chat.syncThreadMessages'))
					.set(credentials)
					.query({
						tmid: threadMessage.tmid,
						updatedSince: 'updatedSince',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-not-allowed');
						expect(res.body).to.have.property('error', 'Threads Disabled [error-not-allowed]');
					})
					.end(done);
			});
		});

		it('should return an error when the required param "tmid" is missing', (done) => {
			updateSetting('Threads_enabled', true).then(() => {
				request
					.get(api('chat.syncThreadMessages'))
					.set(credentials)
					.query({})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-invalid-params');
						expect(res.body).to.have.property('error', 'The required "tmid" query param is missing. [error-invalid-params]');
					})
					.end(done);
			});
		});

		it('should return an error when the required param "updatedSince" is missing', (done) => {
			updateSetting('Threads_enabled', true).then(() => {
				request
					.get(api('chat.syncThreadMessages'))
					.set(credentials)
					.query({
						tmid: threadMessage.tmid,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-updatedSince-param-invalid');
						expect(res.body).to.have.property('error', 'The required param "updatedSince" is missing. [error-updatedSince-param-invalid]');
					})
					.end(done);
			});
		});

		it('should return an error when the param "updatedSince" is an invalid date', (done) => {
			updateSetting('Threads_enabled', true).then(() => {
				request
					.get(api('chat.syncThreadMessages'))
					.set(credentials)
					.query({
						tmid: threadMessage.tmid,
						updatedSince: 'invalid-date',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-updatedSince-param-invalid');
						expect(res.body).to.have.property(
							'error',
							'The "updatedSince" query parameter must be a valid date. [error-updatedSince-param-invalid]',
						);
					})
					.end(done);
			});
		});

		it('should return an error when the user is not allowed access the room', (done) => {
			createUser().then((createdUser) => {
				login(createdUser.username, password).then((userCredentials) => {
					updatePermission('view-c-room', []).then(() => {
						request
							.get(api('chat.syncThreadMessages'))
							.set(userCredentials)
							.query({
								tmid: threadMessage.tmid,
								updatedSince: new Date().toISOString(),
							})
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((res) => {
								expect(res.body).to.have.property('success', false);
								expect(res.body).to.have.property('errorType', 'error-not-allowed');
								expect(res.body).to.have.property('error', 'Not Allowed [error-not-allowed]');
							})
							.end(done);
					});
				});
			});
		});

		it("should return the thread's message list", (done) => {
			updatePermission('view-c-room', ['admin', 'user']).then(() => {
				request
					.get(api('chat.syncThreadMessages'))
					.set(credentials)
					.query({
						tmid: threadMessage.tmid,
						updatedSince: new Date('2019-04-01').toISOString(),
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('messages').and.to.be.an('object');
						expect(res.body.messages).to.have.property('update').and.to.be.an('array');
						expect(res.body.messages).to.have.property('remove').and.to.be.an('array');
						expect(res.body.messages.update).to.have.lengthOf(1);
						expect(res.body.messages.remove).to.have.lengthOf(0);
						expect(res.body.messages.update[0].id).to.be.equal(createdThreadMessage.tmid);
					})
					.end(done);
			});
		});
	});

	describe('[/chat.followMessage]', () => {
		let testChannel;
		let threadMessage;
		before((done) => {
			createRoom({ type: 'c', name: `channel.test.threads.follow.${Date.now()}` }).end((err, res) => {
				testChannel = res.body.channel;
				sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Message to create thread',
				}).end((err, message) => {
					sendSimpleMessage({
						roomId: testChannel._id,
						text: 'Thread Message',
						tmid: message.body.message._id,
					}).end((err, res) => {
						threadMessage = res.body.message;
						done();
					});
				});
			});
		});

		it('should return an error for chat.followMessage when threads are not allowed in this server', (done) => {
			updateSetting('Threads_enabled', false).then(() => {
				request
					.post(api('chat.followMessage'))
					.set(credentials)
					.send({
						mid: threadMessage.tmid,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-not-allowed');
						expect(res.body).to.have.property('error', 'not-allowed [error-not-allowed]');
					})
					.end(done);
			});
		});

		it('should return an error when the message does not exist', (done) => {
			updateSetting('Threads_enabled', true).then(() => {
				request
					.post(api('chat.followMessage'))
					.set(credentials)
					.send({
						mid: 'invalid-message-id',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-invalid-message');
						expect(res.body).to.have.property('error', 'Invalid message [error-invalid-message]');
					})
					.end(done);
			});
		});

		it('should return an error when the user is not allowed access the room', (done) => {
			createUser().then((createdUser) => {
				login(createdUser.username, password).then((userCredentials) => {
					updatePermission('view-c-room', []).then(() => {
						request
							.post(api('chat.followMessage'))
							.set(userCredentials)
							.send({
								mid: threadMessage.tmid,
							})
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((res) => {
								expect(res.body).to.have.property('success', false);
								expect(res.body).to.have.property('errorType', 'error-not-allowed');
								expect(res.body).to.have.property('error', 'not-allowed [error-not-allowed]');
							})
							.end(done);
					});
				});
			});
		});

		it('should return success: true when it execute successfully', (done) => {
			updatePermission('view-c-room', ['admin', 'user']).then(() => {
				request
					.post(api('chat.followMessage'))
					.set(credentials)
					.send({
						mid: threadMessage.tmid,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});
	});

	describe('[/chat.unfollowMessage]', () => {
		let testChannel;
		let threadMessage;
		before((done) => {
			createRoom({ type: 'c', name: `channel.test.threads.unfollow.${Date.now()}` }).end((err, res) => {
				testChannel = res.body.channel;
				sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Message to create thread',
				}).end((err, message) => {
					sendSimpleMessage({
						roomId: testChannel._id,
						text: 'Thread Message',
						tmid: message.body.message._id,
					}).end((err, res) => {
						threadMessage = res.body.message;
						done();
					});
				});
			});
		});

		it('should return an error for chat.unfollowMessage when threads are not allowed in this server', (done) => {
			updateSetting('Threads_enabled', false).then(() => {
				request
					.post(api('chat.unfollowMessage'))
					.set(credentials)
					.send({
						mid: threadMessage.tmid,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-not-allowed');
						expect(res.body).to.have.property('error', 'not-allowed [error-not-allowed]');
					})
					.end(done);
			});
		});

		it('should return an error when the message does not exist', (done) => {
			updateSetting('Threads_enabled', true).then(() => {
				request
					.post(api('chat.unfollowMessage'))
					.set(credentials)
					.send({
						mid: 'invalid-message-id',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-invalid-message');
						expect(res.body).to.have.property('error', 'Invalid message [error-invalid-message]');
					})
					.end(done);
			});
		});

		it('should return an error when the user is not allowed access the room', (done) => {
			createUser().then((createdUser) => {
				login(createdUser.username, password).then((userCredentials) => {
					updatePermission('view-c-room', []).then(() => {
						request
							.post(api('chat.unfollowMessage'))
							.set(userCredentials)
							.send({
								mid: threadMessage.tmid,
							})
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((res) => {
								expect(res.body).to.have.property('success', false);
								expect(res.body).to.have.property('errorType', 'error-not-allowed');
								expect(res.body).to.have.property('error', 'not-allowed [error-not-allowed]');
							})
							.end(done);
					});
				});
			});
		});

		it('should return success: true when it execute successfully', (done) => {
			updatePermission('view-c-room', ['admin', 'user']).then(() => {
				request
					.post(api('chat.unfollowMessage'))
					.set(credentials)
					.send({
						mid: threadMessage.tmid,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});
	});
});
