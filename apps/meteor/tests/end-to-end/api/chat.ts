import type { Credentials } from '@rocket.chat/api-client';
import type { IMessage, IRoom, ISubscription, IThreadMessage, IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { expect } from 'chai';
import { after, before, beforeEach, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { followMessage, sendSimpleMessage, deleteMessage } from '../../data/chat.helper';
import { imgURL } from '../../data/interactions';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { addUserToRoom, createRoom, deleteRoom, getSubscriptionByRoomId } from '../../data/rooms.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

const pinMessage = ({ msgId }: { msgId: IMessage['_id'] }) => {
	if (!msgId) {
		throw new Error('"msgId" is required in "pinMessage" test helper');
	}

	return request.post(api('chat.pinMessage')).set(credentials).send({
		messageId: msgId,
	});
};

describe('[Chat]', () => {
	let testChannel: IRoom;
	let message: { _id: IMessage['_id'] };

	before((done) => getCredentials(done));

	before(async () => {
		testChannel = (await createRoom({ type: 'c', name: `chat.api-test-${Date.now()}` })).body.channel;
	});

	after(() => deleteRoom({ type: 'c', roomId: testChannel._id }));

	describe('/chat.postMessage', () => {
		it('should throw an error when at least one of required parameters(channel, roomId) is not sent', (done) => {
			void request
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
				})
				.end(done);
		});

		it('should throw an error when it has some properties with the wrong type(attachments.title_link_download, attachments.fields, message_link)', (done) => {
			void request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
			void request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: testChannel.name,
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
			void request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: testChannel.name,
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
					message = { _id: res.body.message._id };
				})
				.end(done);
		});

		describe('text message allowed size', () => {
			before(async () => {
				await updateSetting('Message_MaxAllowedSize', 10);
			});

			after(async () => {
				await updateSetting('Message_MaxAllowedSize', 5000);
			});

			it('should return an error if text parameter surpasses the maximum allowed size', (done) => {
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: '#general',
						text: 'Text to test max limit allowed',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'error-message-size-exceeded');
					})
					.end(done);
			});

			it('should return an error if text parameter in the first attachment surpasses the maximum allowed size', (done) => {
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
						text: 'Yay!',
						emoji: ':smirk:',
						attachments: [
							{
								color: '#ff0000',
								text: 'Text to test max limit allowed',
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
								fields: [],
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'error-message-size-exceeded');
					})
					.end(done);
			});

			it('should return an error if text parameter in any of the attachments surpasses the maximum allowed size', (done) => {
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
						text: 'Yay!',
						emoji: ':smirk:',
						attachments: [
							{
								color: '#ff0000',
								text: 'Yay!',
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
								fields: [],
							},
							{
								color: '#ff0000',
								text: 'Text to large to test max limit allowed',
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
								fields: [],
							},
						],
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'error-message-size-exceeded');
					})
					.end(done);
			});

			it('should pass if any text parameter length does not surpasses the maximum allowed size', (done) => {
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
						text: 'Sample',
						emoji: ':smirk:',
						attachments: [
							{
								color: '#ff0000',
								text: 'Sample',
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
						expect(res.body).to.have.nested.property('message.msg', 'Sample');
					})
					.end(done);
			});
		});
	});

	describe('/chat.getMessage', () => {
		it('should retrieve the message successfully', (done) => {
			void request
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
			void request
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
				void request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						channel: testChannel.name,
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
			void request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						channel: testChannel.name,
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
			void request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						_id: message._id,
						rid: testChannel._id,
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

		describe('Bad words filter', () => {
			before(() =>
				Promise.all([updateSetting('Message_AllowBadWordsFilter', true), updateSetting('Message_BadWordsFilterList', 'badword,badword2')]),
			);

			after(() => Promise.all([updateSetting('Message_AllowBadWordsFilter', false), updateSetting('Message_BadWordsFilterList', '')]));

			it('should censor bad words on send', async () => {
				const badMessage = {
					_id: Random.id(),
					rid: testChannel._id,
					msg: 'This message has badword badword2',
				};

				await request
					.post(api('chat.sendMessage'))
					.set(credentials)
					.send({ message: badMessage })
					.expect(200)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('message');
						const { message } = res.body;
						expect(message).to.have.property('msg', 'This message has ******* ********');
						expect(message).to.have.property('md').to.be.an('array').that.has.lengthOf(1);
						const para = message.md[0];
						expect(para).to.have.property('value').to.be.an('array').that.has.lengthOf(1);
						const text = para.value[0];
						expect(text).to.have.property('value', 'This message has ******* ********');
					});
			});
		});

		describe('oembed', () => {
			let ytEmbedMsgId: IMessage['_id'];
			let imgUrlMsgId: IMessage['_id'];

			before(() => Promise.all([updateSetting('API_EmbedIgnoredHosts', ''), updateSetting('API_EmbedSafePorts', '80, 443, 3000')]));

			after(() =>
				Promise.all([
					updateSetting('API_EmbedIgnoredHosts', 'localhost, 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16'),
					updateSetting('API_EmbedSafePorts', '80, 443'),
				]),
			);

			before(async () => {
				const ytEmbedMsgPayload = {
					_id: `id-${Date.now()}`,
					rid: testChannel._id,
					msg: 'https://www.youtube.com/watch?v=T2v29gK8fP4',
					emoji: ':smirk:',
				};
				const ytPostResponse = await request.post(api('chat.sendMessage')).set(credentials).send({ message: ytEmbedMsgPayload });
				ytEmbedMsgId = ytPostResponse.body.message._id;
			});

			before(async () => {
				const imgUrlMsgPayload = {
					_id: `id-${Date.now()}1`,
					rid: testChannel._id,
					msg: 'http://localhost:3000/images/logo/logo.png',
					emoji: ':smirk:',
				};

				const imgUrlResponse = await request.post(api('chat.sendMessage')).set(credentials).send({ message: imgUrlMsgPayload });

				imgUrlMsgId = imgUrlResponse.body.message._id;
			});

			it('should have an iframe oembed with style max-width', (done) => {
				setTimeout(() => {
					void request
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
					void request
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

			it('should not generate previews if an empty array of URL to preview is provided', async () => {
				let msgId;
				await request
					.post(api('chat.sendMessage'))
					.set(credentials)
					.send({
						message: {
							rid: testChannel._id,
							msg: 'https://www.youtube.com/watch?v=T2v29gK8fP4',
						},
						previewUrls: [],
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('message').to.have.property('urls').to.be.an('array').that.is.not.empty;
						expect(res.body.message.urls[0]).to.have.property('ignoreParse', true);
						msgId = res.body.message._id;
					});

				await request
					.get(api('chat.getMessage'))
					.set(credentials)
					.query({
						msgId,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('message').to.have.property('urls').to.be.an('array').that.has.lengthOf(1);

						expect(res.body.message.urls[0]).to.have.property('meta').to.deep.equals({});
					});
			});

			it('should generate previews of chosen URL when the previewUrls array is provided', async () => {
				let msgId;
				await request
					.post(api('chat.sendMessage'))
					.set(credentials)
					.send({
						message: {
							rid: testChannel._id,
							msg: 'https://www.youtube.com/watch?v=T2v29gK8fP4 https://www.rocket.chat/',
						},
						previewUrls: ['https://www.rocket.chat/'],
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('message').to.have.property('urls').to.be.an('array').that.has.lengthOf(2);
						expect(res.body.message.urls[0]).to.have.property('ignoreParse', true);
						expect(res.body.message.urls[1]).to.not.have.property('ignoreParse');
						msgId = res.body.message._id;
					});

				await request
					.get(api('chat.getMessage'))
					.set(credentials)
					.query({
						msgId,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('message').to.have.property('urls').to.be.an('array').that.has.lengthOf(2);

						expect(res.body.message.urls[0]).to.have.property('meta').that.is.an('object').that.is.empty;
						expect(res.body.message.urls[1]).to.have.property('meta').that.is.an('object').that.is.not.empty;
					});
			});

			it('should not generate previews if the message contains more than five external URL', async () => {
				let msgId;
				const urls = [
					'https://www.youtube.com/watch?v=no050HN4ojo',
					'https://www.youtube.com/watch?v=9iaSd13mqXA',
					'https://www.youtube.com/watch?v=MW_qsbgt1KQ',
					'https://www.youtube.com/watch?v=hLF1XwH5rd4',
					'https://www.youtube.com/watch?v=Eo-F9hRBbTk',
					'https://www.youtube.com/watch?v=08ms3W7adFI',
				];
				await request
					.post(api('chat.sendMessage'))
					.set(credentials)
					.send({
						message: {
							rid: testChannel._id,
							msg: urls.join(' '),
						},
						previewUrls: urls,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('message').to.have.property('urls').to.be.an('array').that.has.lengthOf(urls.length);
						msgId = res.body.message._id;
					});

				await request
					.get(api('chat.getMessage'))
					.set(credentials)
					.query({
						msgId,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('message').to.have.property('urls').to.be.an('array').that.has.lengthOf(urls.length);

						(res.body.message as IMessage).urls?.forEach((url) => {
							expect(url).to.not.have.property('ignoreParse');
							expect(url).to.have.property('meta').that.is.an('object').that.is.empty;
						});
					});
			});
		});

		describe('Read only channel', () => {
			let readOnlyChannel: IRoom;
			let userCredentials: Credentials;
			let user: TestUser<IUser>;

			before(async () => {
				user = await createUser();
				userCredentials = await login(user.username, password);
			});

			after(async () =>
				Promise.all([
					deleteRoom({ type: 'c', roomId: readOnlyChannel._id }),
					deleteUser(user),
					updatePermission('post-readonly', ['admin', 'owner', 'moderator']),
				]),
			);

			it('Creating a read-only channel', (done) => {
				void request
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
				void request
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
				void request
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
				void request
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
			});
		});

		it('should fail if user does not have the message-impersonate permission and tries to send message with alias param', (done) => {
			void request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						rid: testChannel._id,
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
			void request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						rid: testChannel._id,
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

		it('should fail if message is a system message', () => {
			const msgId = Random.id();
			return request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						_id: msgId,
						rid: 'GENERAL',
						msg: 'xss',
						t: 'subscription-role-added',
						role: '<h1>XSS<iframe srcdoc=\'<script src="/file-upload/664b3f90c4d3e60470c5e34a/js.js"></script>\'></iframe>',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		describe('customFields', () => {
			async function testMessageSending({
				customFields,
				testCb,
				statusCode,
			}: {
				customFields?: Record<string, unknown>;
				testCb: (res: Response) => any;
				statusCode: number;
			}) {
				await request
					.post(api('chat.sendMessage'))
					.set(credentials)
					.send({
						message: {
							rid: testChannel._id,
							msg: 'Sample message',
							customFields,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(statusCode)
					.expect(testCb);

				await (
					customFields
						? request.post(api(`rooms.upload/${testChannel._id}`)).field('customFields', JSON.stringify(customFields))
						: request.post(api(`rooms.upload/${testChannel._id}`))
				)
					.set(credentials)
					.attach('file', imgURL)
					.expect('Content-Type', 'application/json')
					.expect(statusCode)
					.expect(testCb);

				await request
					.post(api('chat.postMessage'))
					.set(credentials)
					.send({
						roomId: testChannel._id,
						text: 'Sample message',
						customFields,
					})
					.expect('Content-Type', 'application/json')
					.expect(statusCode)
					.expect(testCb);
			}
			describe('when disabled', () => {
				it('should not allow sending custom fields', async () => {
					await testMessageSending({
						customFields: {
							field1: 'value1',
						},
						statusCode: 400,
						testCb: (res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error', 'Custom fields not enabled');
						},
					});
				});

				it('should not allow update custom fields', async () => {
					const res = await sendSimpleMessage({ roomId: testChannel._id });
					const msgId = res.body.message._id;

					await request
						.post(api('chat.update'))
						.set(credentials)
						.send({
							roomId: testChannel._id,
							msgId,
							text: 'Sample message Updated',
							customFields: {
								field1: 'value1',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error', 'Custom fields not enabled');
						});
				});
			});

			describe('when enabled', () => {
				before(async () => {
					await updateSetting('Message_CustomFields_Enabled', true);
					await updateSetting(
						'Message_CustomFields',
						JSON.stringify({
							properties: {
								priority: {
									type: 'string',
									nullable: false,
									enum: ['low', 'medium', 'high'],
								},
							},
							required: ['priority'],
						}),
					);
				});

				after(async () => {
					await updateSetting('Message_CustomFields_Enabled', false);
				});

				it('should allow not sending custom fields', async () => {
					await testMessageSending({
						statusCode: 200,
						testCb: (res) => {
							expect(res.body).to.have.property('success', true);
						},
					});
				});

				it('should not allow sending empty custom fields', async () => {
					await testMessageSending({
						customFields: {},
						statusCode: 400,
						testCb: (res) => {
							expect(res.body).to.have.property('success', false);
						},
					});
				});

				it('should not allow sending wrong custom fields', async () => {
					await testMessageSending({
						customFields: {
							field1: 'value1',
						},
						statusCode: 400,
						testCb: (res) => {
							expect(res.body).to.have.property('success', false);
						},
					});
				});

				it('should allow sending correct custom fields', async () => {
					await testMessageSending({
						customFields: {
							priority: 'low',
						},
						statusCode: 200,
						testCb: (res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.message).to.have.property('customFields').to.deep.equal({ priority: 'low' });
						},
					});
				});

				it('should allow not sending custom fields on update', async () => {
					const res = await sendSimpleMessage({ roomId: testChannel._id });
					const msgId = res.body.message._id;

					await request
						.post(api('chat.update'))
						.set(credentials)
						.send({
							roomId: testChannel._id,
							msgId,
							text: 'Sample message Updated',
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
						});
				});

				it('should not allow update empty custom fields', async () => {
					const res = await sendSimpleMessage({ roomId: testChannel._id });
					const msgId = res.body.message._id;

					await request
						.post(api('chat.update'))
						.set(credentials)
						.send({
							roomId: testChannel._id,
							msgId,
							text: 'Sample message Updated',
							customFields: {},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						});
				});

				it('should not allow update wrong custom fields', async () => {
					const res = await sendSimpleMessage({ roomId: testChannel._id });
					const msgId = res.body.message._id;

					await request
						.post(api('chat.update'))
						.set(credentials)
						.send({
							roomId: testChannel._id,
							msgId,
							text: 'Sample message Updated',
							customFields: {
								field1: 'value1',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						});
				});

				it('should allow update correct custom fields', async () => {
					const res = await sendSimpleMessage({ roomId: testChannel._id });
					const msgId = res.body.message._id;

					await request
						.post(api('chat.update'))
						.set(credentials)
						.send({
							roomId: testChannel._id,
							msgId,
							text: 'Sample message Updated',
							customFields: {
								priority: 'low',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.message).to.have.property('customFields').to.deep.equal({ priority: 'low' });
						});
				});
			});
		});
	});

	describe('/chat.update', () => {
		const siteUrl = process.env.SITE_URL || process.env.TEST_API_URL || 'http://localhost:3000';
		let simpleMessageId: IMessage['_id'];

		before('should send simple message in room', async () => {
			await updateSetting('Message_CustomFields_Enabled', true);
			await updateSetting('Message_CustomFields', JSON.stringify({ properties: { test: { type: 'string' } } }));
			const res = await sendSimpleMessage({ roomId: 'GENERAL' });
			simpleMessageId = res.body.message._id;
		});

		after(async () => {
			await updateSetting('Message_CustomFields_Enabled', false);
			await updateSetting('Message_CustomFields', '');
		});
		it('should fail updating a message if no room id is provided', () => {
			return request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					msgId: message._id,
					text: 'This message was edited via API',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should fail updating a message if no message id is provided', () => {
			return request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					text: 'This message was edited via API',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should fail updating a message if no  text is provided', () => {
			return request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should fail updating a message if an invalid message id is provided', () => {
			return request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					msgId: 'invalid-id',
					text: 'This message was edited via API',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'No message found with the id of "invalid-id".');
				});
		});

		it('should fail updating a message if it is not in the provided room', () => {
			return request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: 'invalid-room',
					msgId: message._id,
					text: 'This message was edited via API',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'The room id provided does not match where the message is from.');
				});
		});

		it('should update a message successfully', (done) => {
			void request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
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

		it('should add quote attachments to a message', async () => {
			const quotedMsgLink = `${siteUrl}/channel/general?msg=${message._id}`;
			void request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					msgId: message._id,
					text: `Testing quotes ${quotedMsgLink}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', `Testing quotes ${quotedMsgLink}`);
					expect(res.body.message).to.have.property('attachments').that.is.an('array').that.has.lengthOf(1);
					expect(res.body.message.attachments[0]).to.have.property('message_link', quotedMsgLink);
				});
		});

		it('should replace a quote attachment in a message', async () => {
			const quotedMsgLink = `${siteUrl}/channel/general?msg=${simpleMessageId}`;
			void request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					msgId: message._id,
					text: `Testing quotes ${quotedMsgLink}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', `Testing quotes ${quotedMsgLink}`);
					expect(res.body.message).to.have.property('attachments').that.is.an('array').that.has.lengthOf(1);
					expect(res.body.message.attachments[0]).to.have.property('message_link', quotedMsgLink);
				});
		});

		it('should add multiple quote attachments in a single message', async () => {
			const quotedMsgLink = `${siteUrl}/channel/general?msg=${simpleMessageId}`;
			const newQuotedMsgLink = `${siteUrl}/channel/general?msg=${message._id}`;
			void request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					msgId: message._id,
					text: `${newQuotedMsgLink} Testing quotes ${quotedMsgLink}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', `Testing quotes ${quotedMsgLink}`);
					expect(res.body.message).to.have.property('attachments').that.is.an('array').that.has.lengthOf(2);
					expect(res.body.message.attachments[0]).to.have.property('message_link', newQuotedMsgLink);
					expect(res.body.message.attachments[1]).to.have.property('message_link', quotedMsgLink);
				});
		});

		it('should erase old quote attachments when updating a message', async () => {
			await request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					msgId: message._id,
					text: 'This message was edited via API',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', 'This message was edited via API');
					expect(res.body.message).to.have.property('attachments').that.is.an('array').that.has.lengthOf(0);
				});
		});

		it('should do nothing if the message text hasnt changed and theres no custom fields', async () => {
			await request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					msgId: message._id,
					text: 'This message was edited via API',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', 'This message was edited via API');
					expect(res.body).to.not.have.nested.property('message.customFields');
				});
		});

		it('should update message custom fields along with msg', async () => {
			await request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					msgId: message._id,
					text: 'This message was edited via API 2',
					customFields: { test: 'test' },
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', 'This message was edited via API 2');
					expect(res.body.message).to.have.property('customFields').that.is.an('object').that.deep.equals({ test: 'test' });
				});
		});

		it('should update message custom fields without changes to msg', async () => {
			await request
				.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					msgId: message._id,
					text: 'This message was edited via API 2',
					customFields: { test: 'test 2' },
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', 'This message was edited via API 2');
					expect(res.body.message).to.have.property('customFields').that.is.an('object').that.deep.equals({ test: 'test 2' });
				});
		});

		describe('Bad words filter', () => {
			before(() =>
				Promise.all([updateSetting('Message_AllowBadWordsFilter', true), updateSetting('Message_BadWordsFilterList', 'badword,badword2')]),
			);

			after(() => Promise.all([updateSetting('Message_AllowBadWordsFilter', false), updateSetting('Message_BadWordsFilterList', '')]));

			it('should censor bad words on update', async () => {
				await request
					.post(api('chat.update'))
					.set(credentials)
					.send({
						roomId: testChannel._id,
						msgId: message._id,
						text: 'This message has badword badword2',
					})
					.expect(200)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('message');
						const { message } = res.body;
						expect(message).to.have.property('msg', 'This message has ******* ********');
						expect(message).to.have.property('md').to.be.an('array').that.has.lengthOf(1);
						const para = message.md[0];
						expect(para).to.have.property('value').to.be.an('array').that.has.lengthOf(1);
						const text = para.value[0];
						expect(text).to.have.property('value', 'This message has ******* ********');
					});
			});
		});
	});

	describe('[/chat.delete]', () => {
		let msgId: IMessage['_id'];
		let user: TestUser<IUser>;
		let userCredentials: Credentials;

		before(async () => {
			user = await createUser();
			userCredentials = await login(user.username, password);
		});

		after(() => deleteUser(user));

		beforeEach((done) => {
			void request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						rid: testChannel._id,
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
		it('should fail deleting a message if no message id is provided', async () => {
			return request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});
		it('should fail deleting a message if no room id is provided', async () => {
			return request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					msgId,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});
		it('should fail deleting a message if it is not in the provided room', async () => {
			return request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: 'invalid-room',
					msgId,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'The room id provided does not match where the message is from.');
				});
		});
		it('should fail deleting a message if an invalid id is provided', async () => {
			return request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					msgId: 'invalid-id',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', `No message found with the id of "invalid-id".`);
				});
		});
		it('should delete a message successfully', (done) => {
			void request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
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
			void request
				.post(api('chat.sendMessage'))
				.set(userCredentials)
				.send({
					message: {
						rid: testChannel._id,
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
			void request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
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

		describe('when deleting a thread message', () => {
			let otherUser: TestUser<IUser>;
			let otherUserCredentials: Credentials;
			let parentThreadId: IMessage['_id'];

			before(async () => {
				const username = `user${+new Date()}`;
				otherUser = await createUser({ username });
				otherUserCredentials = await login(otherUser.username, password);
				parentThreadId = (await sendSimpleMessage({ roomId: testChannel._id })).body.message._id;
				await addUserToRoom({ rid: testChannel._id, usernames: [otherUser.username] });
			});

			after(() => Promise.all([deleteUser(otherUser), deleteMessage({ msgId: parentThreadId, roomId: testChannel._id })]));

			const expectNoUnreadThreadMessages = (s: ISubscription) => {
				expect(s).to.have.property('tunread');
				expect(s.tunread).to.be.an('array');
				expect(s.tunread).to.deep.equal([]);
			};

			it('should reset the unread counter if the message was removed', async () => {
				const { body } = await sendSimpleMessage({ roomId: testChannel._id, tmid: parentThreadId, userCredentials: otherUserCredentials });
				const childrenMessageId = body.message._id;

				await followMessage({ msgId: parentThreadId, requestCredentials: otherUserCredentials });
				await deleteMessage({ msgId: childrenMessageId, roomId: testChannel._id });

				const userWhoCreatedTheThreadSubscription = await getSubscriptionByRoomId(testChannel._id);

				expectNoUnreadThreadMessages(userWhoCreatedTheThreadSubscription);
			});

			it('should reset the unread counter of users who followed the thread', async () => {
				const { body } = await sendSimpleMessage({ roomId: testChannel._id, tmid: parentThreadId });
				const childrenMessageId = body.message._id;

				await followMessage({ msgId: parentThreadId, requestCredentials: otherUserCredentials });
				await deleteMessage({ msgId: childrenMessageId, roomId: testChannel._id });

				const userWhoWasFollowingTheThreadSubscription = await getSubscriptionByRoomId(testChannel._id, otherUserCredentials);

				expectNoUnreadThreadMessages(userWhoWasFollowingTheThreadSubscription);
			});
		});
	});

	describe('/chat.search', () => {
		before(async () => {
			const sendMessage = (text: string) =>
				request
					.post(api('chat.sendMessage'))
					.set(credentials)
					.send({
						message: {
							rid: testChannel._id,
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
			void request
				.get(api('chat.search'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
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
			void request
				.get(api('chat.search'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
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
			void request
				.get(api('chat.search'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
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
			void request
				.get(api('chat.search'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
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
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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

				void request
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
				void request
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

				void request
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
				void request
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
				void request
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
		let roomId: IRoom['_id'];

		before(async () => {
			roomId = (
				await createRoom({
					type: 'c',
					name: `channel.test.${Date.now()}`,
				})
			).body.channel._id;
			const msgId = (await sendSimpleMessage({ roomId })).body.message._id;
			await deleteMessage({ roomId, msgId });
		});

		after(() => deleteRoom({ type: 'c', roomId }));

		describe('when execute successfully', () => {
			it('should return a list of deleted messages', (done) => {
				void request
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
				void request
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
				void request
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
			it('should return statusCode 400', (done) => {
				void request
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
					})
					.end(done);
			});
			it('should return statusCode 400 and an error when "since" is not provided', (done) => {
				void request
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
					})
					.end(done);
			});
			it('should return statusCode 400 and an error when "since" is provided but it is invalid ISODate', (done) => {
				void request
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
					})
					.end(done);
			});
		});
	});

	describe('[/chat.pinMessage]', () => {
		after(() =>
			Promise.all([updateSetting('Message_AllowPinning', true), updatePermission('pin-message', ['owner', 'moderator', 'admin'])]),
		);

		it('should return an error when pinMessage is not allowed in this server', (done) => {
			void updateSetting('Message_AllowPinning', false).then(() => {
				void request
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
			void updateSetting('Message_AllowPinning', true).then(() => {
				void updatePermission('pin-message', []).then(() => {
					void request
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

		it('should return an error when messageId does not exist', async () => {
			await request
				.post(api('chat.pinMessage'))
				.set(credentials)
				.send({
					messageId: 'test',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});
		});

		it('should pin Message successfully', (done) => {
			void updatePermission('pin-message', ['admin']).then(() => {
				void request
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

		it('should return message when its already pinned', async () => {
			await request
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
				});
		});
	});

	describe('[/chat.unPinMessage]', () => {
		after(() =>
			Promise.all([updateSetting('Message_AllowPinning', true), updatePermission('pin-message', ['owner', 'moderator', 'admin'])]),
		);

		it('should return an error when pinMessage is not allowed in this server', (done) => {
			void updateSetting('Message_AllowPinning', false).then(() => {
				void request
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
			void updateSetting('Message_AllowPinning', true).then(() => {
				void updatePermission('pin-message', []).then(() => {
					void request
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
			void updatePermission('pin-message', ['admin']).then(() => {
				void request
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
		after(() => updateSetting('Message_AllowStarring', true));

		it('should return an error when starMessage is not allowed in this server', (done) => {
			void updateSetting('Message_AllowStarring', false).then(() => {
				void request
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
			void updateSetting('Message_AllowStarring', true).then(() => {
				void request
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
		after(() => updateSetting('Message_AllowStarring', true));

		it('should return an error when starMessage is not allowed in this server', (done) => {
			void updateSetting('Message_AllowStarring', false).then(() => {
				void request
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
			void updateSetting('Message_AllowStarring', true).then(() => {
				void request
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
		let user: IUser;
		let testDM: IRoom & { rid: IRoom['_id'] };

		before(async () => {
			user = await createUser();
			await request
				.post(api('im.create'))
				.set(credentials)
				.send({
					username: user.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testDM = res.body.room;
				});
		});

		after(() => Promise.all([deleteRoom({ type: 'd', roomId: testDM.rid }), deleteUser(user)]));

		it('should fail if invalid roomId', (done) => {
			void request
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
			void request
				.get(api('chat.ignoreUser'))
				.set(credentials)
				.query({
					rid: testDM.rid,
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
			void request
				.get(api('chat.ignoreUser'))
				.set(credentials)
				.query({
					rid: testDM.rid,
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
		it('should successfully unignore user', (done) => {
			void request
				.get(api('chat.ignoreUser'))
				.set(credentials)
				.query({
					rid: testDM.rid,
					userId: user._id,
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
		let roomId: IRoom['_id'];

		before(async () => {
			roomId = (
				await createRoom({
					type: 'c',
					name: `channel.test.${Date.now()}`,
				})
			).body.channel._id;

			const msgId = (await sendSimpleMessage({ roomId })).body.message._id;

			await pinMessage({ msgId });
		});

		after(() => deleteRoom({ type: 'c', roomId }));

		describe('when execute successfully', () => {
			it('should return a list of pinned messages', (done) => {
				void request
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
				void request
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
				void request
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
				void request
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
					})
					.end(done);
			});
		});
	});

	describe('[/chat.getMentionedMessages]', () => {
		let testChannel: IRoom;

		before(async () => {
			testChannel = (
				await createRoom({
					type: 'c',
					name: `channel.test.${Date.now()}`,
				})
			).body.channel;
		});

		after(() => deleteRoom({ type: 'c', roomId: testChannel._id }));

		it('should return an error when the required "roomId" parameter is not sent', (done) => {
			void request
				.get(api('chat.getMentionedMessages'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('invalid-params');
				})
				.end(done);
		});

		it('should return an error when the roomId is invalid', (done) => {
			void request
				.get(api('chat.getMentionedMessages'))
				.query({ roomId: 'invalid-room' })
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
			void request
				.get(api('chat.getMentionedMessages'))
				.query({ roomId: testChannel._id })
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
		let testChannel: IRoom;

		before(async () => {
			testChannel = (
				await createRoom({
					type: 'c',
					name: `channel.test.${Date.now()}`,
				})
			).body.channel;
		});

		after(() => deleteRoom({ type: 'c', roomId: testChannel._id }));

		it('should return an error when the required "roomId" parameter is not sent', (done) => {
			void request
				.get(api('chat.getStarredMessages'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('invalid-params');
				})
				.end(done);
		});

		it('should return an error when the roomId is invalid', (done) => {
			void request
				.get(api('chat.getStarredMessages'))
				.query({ roomId: 'invalid-room' })
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
			void request
				.get(api('chat.getStarredMessages'))
				.query({ roomId: testChannel._id })
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
		let testChannel: IRoom;
		let discussionRoom: IRoom & { rid: IRoom['_id'] };
		const messageWords = [
			...messageText.split(' '),
			...messageText.toUpperCase().split(' '),
			...messageText.toLowerCase().split(' '),
			messageText,
			messageText.charAt(0),
			' ',
		];

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.test.getDiscussions.${Date.now()}` })).body.channel;

			discussionRoom = (
				await request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({
						prid: testChannel._id,
						t_name: 'Message to create discussion',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
			).body.discussion;
		});

		after(() => deleteRoom({ type: 'c', roomId: testChannel._id }));

		it('should return an error when the required "roomId" parameter is not sent', (done) => {
			void request
				.get(api('chat.getDiscussions'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return an error when the roomId is invalid', (done) => {
			void request
				.get(api('chat.getDiscussions'))
				.query({ roomId: 'invalid-room' })
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
			void request
				.get(api('chat.getDiscussions'))
				.query({ roomId: testChannel._id })
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
			void request
				.get(api('chat.getDiscussions'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
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

		function filterDiscussionsByText(text: string) {
			it(`should return the room's discussion list filtered by the text '${text}'`, (done) => {
				void request
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
				void request
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

	describe('[/chat.syncMessages]', () => {
		let testChannel: IRoom;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.test.syncMessages.${Date.now()}` })).body.channel;
		});

		after(() => deleteRoom({ type: 'c', roomId: testChannel._id }));

		it('should return an error when the required "roomId" parameter is not sent', (done) => {
			void request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('invalid-params');
					expect(res.body.error).to.include(`must have required property 'roomId'`);
				})
				.end(done);
		});

		it('should return an error when the neither "lastUpdate" or "type" parameter is sent', (done) => {
			void request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: testChannel._id })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-param-required');
					expect(res.body.error).to.include('The "type" or "lastUpdate" parameters must be provided');
				})
				.end(done);
		});

		it('should return an error when the "lastUpdate" parameter is invalid', (done) => {
			void request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: 'invalid-room', lastUpdate: 'invalid-date' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-lastUpdate-param-invalid');
					expect(res.body.error).to.include('The "lastUpdate" query parameter must be a valid date');
				})
				.end(done);
		});

		it('should return an error when user provides an invalid roomId', (done) => {
			void request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: 'invalid-room', lastUpdate: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-not-allowed');
					expect(res.body.error).to.include('Not allowed');
				})
				.end(done);
		});

		it('should return an error when the "type" parameter is not supported', (done) => {
			void request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: testChannel._id, type: 'invalid-type', next: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('invalid-params');
					expect(res.body.error).to.include('must be equal to one of the allowed values');
				})
				.end(done);
		});

		it('should return an error when the "next" or "previous" parameter is sent without the "type" parameter', async () => {
			const nextResponse = await request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: testChannel._id, next: new Date().toISOString() });

			const previousResponse = await request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: testChannel._id, previous: new Date().toISOString() });

			expect(nextResponse.statusCode).to.equal(400);
			expect(nextResponse.body).to.have.property('success', false);
			expect(nextResponse.body.errorType).to.be.equal('error-param-required');
			expect(nextResponse.body.error).to.include('The "type" or "lastUpdate" parameters must be provided');

			expect(previousResponse.statusCode).to.equal(400);
			expect(previousResponse.body).to.have.property('success', false);
			expect(previousResponse.body.errorType).to.be.equal('error-param-required');
			expect(previousResponse.body.error).to.include('The "type" or "lastUpdate" parameters must be provided');
		});

		it('should return an error when both "next" and "previous" are sent', (done) => {
			void request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: testChannel._id, type: 'UPDATED', next: new Date().toISOString(), previous: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-cursor-conflict');
					expect(res.body.error).to.include('You cannot provide both "next" and "previous" parameters');
				})
				.end(done);
		});

		it('should return an error when both "next" or "previous" and "lastUpdate" are sent', (done) => {
			void request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: testChannel._id, type: 'UPDATED', next: new Date().toISOString(), lastUpdate: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-cursor-and-lastUpdate-conflict');
					expect(res.body.error).to.include('The attributes "next", "previous" and "lastUpdate" cannot be used together');
				})
				.end(done);
		});

		it('should return an error when neither "type" or "lastUpdate" are sent', (done) => {
			void request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: testChannel._id })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-param-required');
					expect(res.body.error).to.include('The "type" or "lastUpdate" parameters must be provided');
				})
				.end(done);
		});

		it('should return an empty response when there are no messages to sync', (done) => {
			void request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: testChannel._id, lastUpdate: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.result).to.have.property('updated').and.to.be.an('array');
					expect(res.body.result).to.have.property('deleted').and.to.be.an('array');
					expect(res.body.result.updated).to.have.lengthOf(0);
					expect(res.body.result.deleted).to.have.lengthOf(0);
				})
				.end(done);
		});

		it('should return all updated and deleted messages since "lastUpdate" parameter date', async () => {
			const lastUpdate = new Date().toISOString();

			// Create two messages isolated to avoid ts conflict
			const firstMessage = await sendSimpleMessage({ roomId: testChannel._id, text: 'First Message' });
			const secondMessage = await sendSimpleMessage({ roomId: testChannel._id, text: 'Second Message' });

			const response = await request.get(api('chat.syncMessages')).set(credentials).query({ roomId: testChannel._id, lastUpdate });

			expect(response.body.result.updated).to.have.lengthOf(2);
			expect(response.body.result.updated[0]._id).to.be.equal(secondMessage.body.message._id);
			expect(response.body.result.updated[1]._id).to.be.equal(firstMessage.body.message._id);
			expect(response.body.result.deleted).to.have.lengthOf(0);

			await deleteMessage({ roomId: testChannel._id, msgId: firstMessage.body.message._id });

			const responseAfterDelete = await request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: testChannel._id, lastUpdate });

			expect(responseAfterDelete.body.result.updated).to.have.lengthOf(1);
			expect(responseAfterDelete.body.result.updated[0]._id).to.be.equal(secondMessage.body.message._id);
			expect(responseAfterDelete.body.result.deleted).to.have.lengthOf(1);
			expect(responseAfterDelete.body.result.deleted[0]._id).to.be.equal(firstMessage.body.message._id);

			await deleteMessage({ roomId: testChannel._id, msgId: secondMessage.body.message._id });
		});

		it('should return all updated messages with a cursor when "type" parameter is "UPDATED"', async () => {
			const lastUpdate = new Date();
			const firstMessage = await sendSimpleMessage({ roomId: testChannel._id, text: 'First Message' });
			const secondMessage = await sendSimpleMessage({ roomId: testChannel._id, text: 'Second Message' });
			const thirdMessage = await sendSimpleMessage({ roomId: testChannel._id, text: 'Third Message' });

			const response = await request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					next: new Date(lastUpdate).getTime().toString(),
					type: 'UPDATED',
					count: 2,
				});

			expect(response.body.result.updated).to.have.lengthOf(2);
			expect(response.body.result.updated[0]._id).to.be.equal(firstMessage.body.message._id);
			expect(response.body.result.updated[1]._id).to.be.equal(secondMessage.body.message._id);
			expect(response.body.result.cursor)
				.to.have.property('next')
				.and.to.equal(new Date(response.body.result.updated[response.body.result.updated.length - 1]._updatedAt).getTime().toString());
			expect(response.body.result.cursor)
				.to.have.property('previous')
				.and.to.equal(new Date(response.body.result.updated[0]._updatedAt).getTime().toString());
			expect(response.body.result.cursor)
				.to.have.property('previous')
				.and.to.equal(new Date(firstMessage.body.message._updatedAt).getTime().toString());

			const responseWithNext = await request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: testChannel._id, next: response.body.result.cursor.next, type: 'UPDATED', count: 2 });

			expect(responseWithNext.body.result.updated).to.have.lengthOf(1);
			expect(responseWithNext.body.result.updated[0]._id).to.be.equal(thirdMessage.body.message._id);
			expect(responseWithNext.body.result.cursor).to.have.property('next').and.to.be.null;
			expect(responseWithNext.body.result.cursor)
				.to.have.property('previous')
				.and.to.equal(new Date(thirdMessage.body.message._updatedAt).getTime().toString());

			await Promise.all([
				deleteMessage({ roomId: testChannel._id, msgId: firstMessage.body.message._id }),
				deleteMessage({ roomId: testChannel._id, msgId: secondMessage.body.message._id }),
				deleteMessage({ roomId: testChannel._id, msgId: thirdMessage.body.message._id }),
			]);
		});

		it('should return all deleted messages with a cursor when "type" parameter is "DELETED"', async () => {
			const newChannel = (await createRoom({ type: 'c', name: `channel.test.syncMessages.${Date.now()}` })).body.channel;
			const lastUpdate = new Date();
			const firstMessage = (await sendSimpleMessage({ roomId: newChannel._id, text: 'First Message' })).body.message;
			const secondMessage = (await sendSimpleMessage({ roomId: newChannel._id, text: 'Second Message' })).body.message;
			const thirdMessage = (await sendSimpleMessage({ roomId: newChannel._id, text: 'Third Message' })).body.message;

			const response = await request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: newChannel._id, next: lastUpdate.getTime().toString(), type: 'DELETED', count: 2 });

			expect(response.body.result.deleted).to.have.lengthOf(0);
			expect(response.body.result.cursor).to.have.property('next').and.to.be.null;
			expect(response.body.result.cursor).to.have.property('previous').and.to.be.null;

			const firstDeletedMessage = (await deleteMessage({ roomId: newChannel._id, msgId: firstMessage._id })).body.message;
			const secondDeletedMessage = (await deleteMessage({ roomId: newChannel._id, msgId: secondMessage._id })).body.message;
			const thirdDeletedMessage = (await deleteMessage({ roomId: newChannel._id, msgId: thirdMessage._id })).body.message;

			const responseAfterDelete = await request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: newChannel._id, next: lastUpdate.getTime().toString(), type: 'DELETED', count: 2 });

			expect(responseAfterDelete.body.result.deleted).to.have.lengthOf(2);
			expect(responseAfterDelete.body.result.deleted[0]._id).to.be.equal(firstDeletedMessage._id);
			expect(responseAfterDelete.body.result.deleted[1]._id).to.be.equal(secondDeletedMessage._id);
			expect(responseAfterDelete.body.result.cursor)
				.to.have.property('next')
				.and.to.equal(
					new Date(responseAfterDelete.body.result.deleted[responseAfterDelete.body.result.deleted.length - 1]._deletedAt)
						.getTime()
						.toString(),
				);
			expect(responseAfterDelete.body.result.cursor)
				.to.have.property('previous')
				.and.to.equal(new Date(responseAfterDelete.body.result.deleted[0]._deletedAt).getTime().toString());

			const responseAfterDeleteWithPrevious = await request
				.get(api('chat.syncMessages'))
				.set(credentials)
				.query({ roomId: newChannel._id, next: responseAfterDelete.body.result.cursor.next, type: 'DELETED', count: 2 });

			expect(responseAfterDeleteWithPrevious.body.result.deleted).to.have.lengthOf(1);
			expect(responseAfterDeleteWithPrevious.body.result.deleted[0]._id).to.be.equal(thirdDeletedMessage._id);
			expect(responseAfterDeleteWithPrevious.body.result.cursor).to.have.property('next').and.to.be.null;
			expect(responseAfterDeleteWithPrevious.body.result.cursor)
				.to.have.property('previous')
				.and.to.equal(new Date(responseAfterDeleteWithPrevious.body.result.deleted[0]._deletedAt).getTime().toString());

			await deleteRoom({ type: 'c', roomId: newChannel._id });
		});
	});
});

describe('Threads', () => {
	let testThreadChannel: IRoom;

	before((done) => getCredentials(done));

	before(async () => {
		testThreadChannel = (await createRoom({ type: 'c', name: `chat.api-test-${Date.now()}` })).body.channel;

		await updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']);
	});

	after(() =>
		Promise.all([
			updateSetting('Threads_enabled', true),
			updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']),
			deleteRoom({ type: 'c', roomId: testThreadChannel._id }),
		]),
	);

	describe('[/chat.getThreadsList]', () => {
		const messageText = 'Message to create thread';
		let testChannel: IRoom;
		let threadMessage: IThreadMessage;
		let user: TestUser<IUser>;
		const messageWords = [
			...messageText.split(' '),
			...messageText.toUpperCase().split(' '),
			...messageText.toLowerCase().split(' '),
			messageText,
			messageText.charAt(0),
			' ',
		];

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.test.threads.${Date.now()}` })).body.channel;
			const { message } = (
				await request
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
			).body;

			threadMessage = (
				await request
					.post(api('chat.sendMessage'))
					.set(credentials)
					.send({
						message: {
							rid: testChannel._id,
							msg: 'Thread message',
							tmid: message._id,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
			).body.message;
		});

		after(() =>
			Promise.all([
				updateSetting('Threads_enabled', true),
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']),
				deleteUser(user),
			]),
		);

		it('should return an error for chat.getThreadsList when threads are not allowed in this server', (done) => {
			void updateSetting('Threads_enabled', false).then(() => {
				void request
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
			void createUser().then((createdUser) => {
				user = createdUser;
				void login(createdUser.username, password).then((userCredentials) => {
					void updateSetting('Threads_enabled', true).then(() => {
						void updatePermission('view-c-room', []).then(() => {
							void request
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
			void updatePermission('view-c-room', ['admin', 'user']).then(() => {
				void request
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

		it("should fail returning a room's thread list if no roomId is provided", async () => {
			await updatePermission('view-c-room', ['admin', 'user']);
			return request
				.get(api('chat.getThreadsList'))
				.set(credentials)
				.query({})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it("should fail returning a room's thread list if an invalid type is provided", async () => {
			return request
				.get(api('chat.getThreadsList'))
				.set(credentials)
				.query({
					rid: testChannel._id,
					type: 'invalid-type',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it("should return the room's thread list", async () => {
			return request
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
				});
		});

		it("should return the room's thread list even requested with count and offset params", (done) => {
			void updatePermission('view-c-room', ['admin', 'user']).then(() => {
				void request
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

		function filterThreadsByText(text: string) {
			it(`should return the room's thread list filtered by the text '${text}'`, (done) => {
				void request
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
				void request
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
			void updatePermission('view-c-room', ['admin', 'user']).then(() => {
				void request
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
		let testChannel: IRoom;
		let threadMessage: IThreadMessage;
		let user: TestUser<IUser>;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `.threads.sync.${Date.now()}` })).body.channel;
			const { body: { message } = {} } = await sendSimpleMessage({
				roomId: testChannel._id,
				text: 'Message to create thread',
			});

			threadMessage = (
				await sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Thread Message',
					tmid: message._id,
				})
			).body.message;
		});

		after(() =>
			Promise.all([
				updateSetting('Threads_enabled', true),
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']),
				deleteUser(user),
			]),
		);

		it('should return an error for chat.getThreadsList when threads are not allowed in this server', (done) => {
			void updateSetting('Threads_enabled', false).then(() => {
				void request
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
			void updateSetting('Threads_enabled', true).then(() => {
				void request
					.get(api('chat.syncThreadsList'))
					.set(credentials)
					.query({})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'invalid-params');
					})
					.end(done);
			});
		});

		it('should return an error when the required param "updatedSince" is missing', (done) => {
			void updateSetting('Threads_enabled', true).then(() => {
				void request
					.get(api('chat.syncThreadsList'))
					.set(credentials)
					.query({
						rid: testChannel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'invalid-params');
					})
					.end(done);
			});
		});

		it('should return an error when the param "updatedSince" is an invalid date', (done) => {
			void updateSetting('Threads_enabled', true).then(() => {
				void request
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
						expect(res.body).to.have.property('errorType', 'invalid-params');
					})
					.end(done);
			});
		});

		it('should return an error when the user is not allowed access the room', (done) => {
			void createUser().then((createdUser) => {
				user = createdUser;
				void login(createdUser.username, password).then((userCredentials) => {
					void updatePermission('view-c-room', []).then(() => {
						void request
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
			void updatePermission('view-c-room', ['admin', 'user']).then(() => {
				void request
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
		let testChannel: IRoom;
		let threadMessage: IThreadMessage;
		let createdThreadMessage: IThreadMessage;
		let user: TestUser<IUser>;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.test.threads.${Date.now()}` })).body.channel;
			createdThreadMessage = (
				await sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Message to create thread',
				})
			).body.message;

			threadMessage = (
				await sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Thread Message',
					tmid: createdThreadMessage._id,
				})
			).body.message;
		});

		after(() =>
			Promise.all([
				updateSetting('Threads_enabled', true),
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']),
				deleteUser(user),
			]),
		);

		it('should return an error for chat.getThreadMessages when threads are not allowed in this server', (done) => {
			void updateSetting('Threads_enabled', false).then(() => {
				void request
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
			void createUser().then((createdUser) => {
				user = createdUser;
				void login(createdUser.username, password).then((userCredentials) => {
					void updateSetting('Threads_enabled', true).then(() => {
						void updatePermission('view-c-room', []).then(() => {
							void request
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
			void updatePermission('view-c-room', ['admin', 'user']).then(() => {
				void request
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
		let testChannel: IRoom;
		let threadMessage: IThreadMessage;
		let createdThreadMessage: IThreadMessage;
		let user: TestUser<IUser>;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `message.threads.${Date.now()}` })).body.channel;
			createdThreadMessage = (
				await sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Message to create thread',
				})
			).body.message;

			threadMessage = (
				await sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Thread Message',
					tmid: createdThreadMessage._id,
				})
			).body.message;
		});

		after(() =>
			Promise.all([
				updateSetting('Threads_enabled', true),
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']),
				deleteUser(user),
			]),
		);

		it('should return an error for chat.syncThreadMessages when threads are not allowed in this server', (done) => {
			void updateSetting('Threads_enabled', false).then(() => {
				void request
					.get(api('chat.syncThreadMessages'))
					.set(credentials)
					.query({
						tmid: threadMessage.tmid,
						updatedSince: new Date().toISOString(),
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
			void updateSetting('Threads_enabled', true).then(() => {
				void request
					.get(api('chat.syncThreadMessages'))
					.set(credentials)
					.query({})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'invalid-params');
					})
					.end(done);
			});
		});

		it('should return an error when the required param "updatedSince" is missing', (done) => {
			void updateSetting('Threads_enabled', true).then(() => {
				void request
					.get(api('chat.syncThreadMessages'))
					.set(credentials)
					.query({
						tmid: threadMessage.tmid,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'invalid-params');
					})
					.end(done);
			});
		});

		it('should return an error when the param "updatedSince" is an invalid date', (done) => {
			void updateSetting('Threads_enabled', true).then(() => {
				void request
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
						expect(res.body).to.have.property('errorType', 'invalid-params');
					})
					.end(done);
			});
		});

		it('should return an error when the user is not allowed access the room', (done) => {
			void createUser().then((createdUser) => {
				user = createdUser;
				void login(createdUser.username, password).then((userCredentials) => {
					void updatePermission('view-c-room', []).then(() => {
						void request
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
			void updatePermission('view-c-room', ['admin', 'user']).then(() => {
				void request
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
		let testChannel: IRoom;
		let threadMessage: IThreadMessage;
		let user: TestUser<IUser>;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.test.threads.follow${Date.now()}` })).body.channel;
			const { body: { message } = {} } = await sendSimpleMessage({
				roomId: testChannel._id,
				text: 'Message to create thread',
			});

			threadMessage = (
				await sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Thread Message',
					tmid: message._id,
				})
			).body.message;
		});

		after(() =>
			Promise.all([
				updateSetting('Threads_enabled', true),
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']),
				deleteUser(user),
			]),
		);

		it('should return an error for chat.followMessage when threads are not allowed in this server', (done) => {
			void updateSetting('Threads_enabled', false).then(() => {
				void request
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
			void updateSetting('Threads_enabled', true).then(() => {
				void request
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
			void createUser().then((createdUser) => {
				user = createdUser;
				void login(createdUser.username, password).then((userCredentials) => {
					void updatePermission('view-c-room', []).then(() => {
						void request
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
			void updatePermission('view-c-room', ['admin', 'user']).then(() => {
				void request
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
		let testChannel: IRoom;
		let threadMessage: IThreadMessage;
		let user: TestUser<IUser>;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.test.threads.unfollow.${Date.now()}` })).body.channel;
			const { body: { message } = {} } = await sendSimpleMessage({
				roomId: testChannel._id,
				text: 'Message to create thread',
			});

			threadMessage = (
				await sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Thread Message',
					tmid: message._id,
				})
			).body.message;
		});

		after(() =>
			Promise.all([
				updateSetting('Threads_enabled', true),
				deleteRoom({ type: 'c', roomId: testChannel._id }),
				updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']),
				deleteUser(user),
			]),
		);
		it('should return an error for chat.unfollowMessage when threads are not allowed in this server', (done) => {
			void updateSetting('Threads_enabled', false).then(() => {
				void request
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
			void updateSetting('Threads_enabled', true).then(() => {
				void request
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
			void createUser().then((createdUser) => {
				user = createdUser;
				void login(createdUser.username, password).then((userCredentials) => {
					void updatePermission('view-c-room', []).then(() => {
						void request
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
			void updatePermission('view-c-room', ['admin', 'user']).then(() => {
				void request
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

	describe('[/chat.getURLPreview]', () => {
		const url = 'https://www.youtube.com/watch?v=no050HN4ojo';
		it('should return the URL preview with metadata and headers', async () => {
			await request
				.get(api('chat.getURLPreview'))
				.set(credentials)
				.query({
					roomId: testThreadChannel._id,
					url,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('urlPreview').and.to.be.an('object').that.is.not.empty;
					expect(res.body.urlPreview).to.have.property('url', url);
					expect(res.body.urlPreview).to.have.property('headers').and.to.be.an('object').that.is.not.empty;
				});
		});

		describe('when an error occurs', () => {
			it('should return statusCode 400 and an error when "roomId" is not provided', async () => {
				await request
					.get(api('chat.getURLPreview'))
					.set(credentials)
					.query({
						url,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});
			it('should return statusCode 400 and an error when "url" is not provided', async () => {
				await request
					.get(api('chat.getURLPreview'))
					.set(credentials)
					.query({
						roomId: testThreadChannel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});
			it('should return statusCode 400 and an error when "roomId" is provided but user is not in the room', async () => {
				await request
					.get(api('chat.getURLPreview'))
					.set(credentials)
					.query({
						roomId: 'undefined',
						url,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.errorType).to.be.equal('error-not-allowed');
					});
			});
		});
	});
});
