import {
	getCredentials,
	api,
	request,
	credentials,
	message,
} from '../../data/api-data.js';
import { password } from '../../data/user';
import { createRoom } from '../../data/rooms.helper.js';
import { sendSimpleMessage, deleteMessage, pinMessage } from '../../data/chat.helper.js';
import { updatePermission, updateSetting } from '../../data/permissions.helper';

describe('[Chat]', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('/chat.postMessage', () => {

		it('should throw an error when at least one of required parameters(channel, roomId) is not sent', (done) => {
			request.post(api('chat.postMessage'))
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
			request.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					text: 'Sample message',
					alias: 'Gruggy',
					emoji: ':smirk:',
					avatar: 'http://res.guggy.com/logo_128.png',
					attachments: [{
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
					}],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});

		it('should throw an error when the properties (attachments.fields.title, attachments.fields.value) are with the wrong type', (done) => {
			request.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					text: 'Sample message',
					alias: 'Gruggy',
					emoji: ':smirk:',
					avatar: 'http://res.guggy.com/logo_128.png',
					attachments: [{
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
						fields: [{
							short: true,
							title: 12,
							value: false,
						}],
					}],
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
			request.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					text: 'Sample message',
					alias: 'Gruggy',
					emoji: ':smirk:',
					avatar: 'http://res.guggy.com/logo_128.png',
					attachments: [{
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
						fields: [{
							short: true,
							title: 'Test',
							value: 'Testing out something or other',
						}, {
							short: true,
							title: 'Another Test',
							value: '[Link](https://google.com/) something and this and that.',
						}],
					}],
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
			request.get(api('chat.getMessage'))
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

		it('should throw an error when the required param \'rid\' is not sent', (done) => {
			request.post(api('chat.sendMessage'))
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
					expect(res.body).to.have.property('error', 'The \'rid\' property on the message object is missing.');
				})
				.end(done);
		});

		it('should throw an error when it has some properties with the wrong type(attachments.title_link_download, attachments.fields, message_link)', (done) => {
			request.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						channel: 'general',
						text: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [{
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
						}],
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
			message._id = `id-${ Date.now() }`;
			request.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						_id: message._id,
						rid: 'GENERAL',
						msg: 'Sample message',
						alias: 'Gruggy',
						emoji: ':smirk:',
						avatar: 'http://res.guggy.com/logo_128.png',
						attachments: [{
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
							fields: [{
								short: true,
								title: 'Test',
								value: 'Testing out something or other',
							}, {
								short: true,
								title: 'Another Test',
								value: '[Link](https://google.com/) something and this and that.',
							}],
						}],
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

		describe('Read only channel', () => {
			let readOnlyChannel;

			it('Creating a read-only channel', (done) => {
				request.post(api('channels.create'))
					.set(credentials)
					.send({
						name: `readonlychannel${ +new Date() }`,
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
				request.post(api('chat.sendMessage'))
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
		});

	});

	describe('/chat.update', () => {
		it('should update a message successfully', (done) => {
			request.post(api('chat.update'))
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
			const username = `user.test.${ Date.now() }`;
			const email = `${ username }@rocket.chat`;
			request.post(api('users.create'))
				.set(credentials)
				.send({ email, name: username, username, password })
				.end((err, res) => {
					user = res.body.user;
					done();
				});
		});
		before((done) => {
			request.post(api('login'))
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
			request.post(api('users.delete')).set(credentials).send({
				userId: user._id,
			}).end(done);
			user = undefined;
		});
		beforeEach((done) => {
			request.post(api('chat.sendMessage'))
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
			request.post(api('chat.delete'))
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
			request.post(api('chat.sendMessage'))
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
			request.post(api('chat.delete'))
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
		it('should return a list of messages when execute successfully', (done) => {
			request.get(api('chat.search'))
				.set(credentials)
				.query({
					roomId: 'GENERAL',
					searchText: 'This message was edited via API',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages');
				})
				.end(done);
		});
		it('should return a list of messages when is provided "count" query parameter execute successfully', (done) => {
			request.get(api('chat.search'))
				.set(credentials)
				.query({
					roomId: 'GENERAL',
					searchText: 'This message was edited via API',
					count: 1,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages');
				})
				.end(done);
		});
	});
	describe('[/chat.react]', () => {
		it('should return statusCode: 200 and success when try unreact a message that\'s no reacted yet', (done) => {
			request.post(api('chat.react'))
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
			request.post(api('chat.react'))
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
			request.post(api('chat.react'))
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
		it('should return statusCode: 200 and success when try react a message that\'s already reacted', (done) => {
			request.post(api('chat.react'))
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
			request.post(api('chat.react'))
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
			request.post(api('chat.react'))
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
			request.post(api('chat.react'))
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
			request.post(api('chat.react'))
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
		describe('when execute successfully', () => {
			it('should return the statusCode 200 and \'receipts\' property and should be equal an array', (done) => {
				request.get(api(`chat.getMessageReadReceipts?messageId=${ message._id }`))
					.set(credentials)
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
			it('should return statusCode 400 and an error', (done) => {
				request.get(api('chat.getMessageReadReceipts'))
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
				request.post(api('chat.reportMessage'))
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
				request.post(api('chat.reportMessage'))
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
				name: `channel.test.${ Date.now() }`,
			}).end((err, res) => {
				roomId = res.body.channel._id;
				sendSimpleMessage({ roomId })
					.end((err, res) => {
						const msgId = res.body.message._id;
						deleteMessage({ roomId, msgId }).end(done);
					});
			});
		});

		describe('when execute successfully', () => {
			it('should return a list of deleted messages', (done) => {
				request.get(api('chat.getDeletedMessages'))
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
				request.get(api('chat.getDeletedMessages'))
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
				request.get(api('chat.getDeletedMessages'))
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
				request.get(api('chat.getDeletedMessages'))
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
				request.get(api('chat.getDeletedMessages'))
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
				request.get(api('chat.getDeletedMessages'))
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
				request.post(api('chat.pinMessage'))
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
					request.post(api('chat.pinMessage'))
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
				request.post(api('chat.pinMessage'))
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
				request.post(api('chat.unPinMessage'))
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
					request.post(api('chat.unPinMessage'))
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
				request.post(api('chat.unPinMessage'))
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
	describe('[/chat.getPinnedMessages]', () => {
		let roomId;
		before((done) => {
			createRoom({
				type: 'c',
				name: `channel.test.${ Date.now() }`,
			}).end((err, res) => {
				roomId = res.body.channel._id;
				sendSimpleMessage({ roomId })
					.end((err, res) => {
						const msgId = res.body.message._id;
						pinMessage({ msgId }).end(done);
					});
			});
		});

		describe('when execute successfully', () => {
			it('should return a list of pinned messages', (done) => {
				request.get(api('chat.getPinnedMessages'))
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
				request.get(api('chat.getPinnedMessages'))
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
				request.get(api('chat.getPinnedMessages'))
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
				request.get(api('chat.getPinnedMessages'))
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
});
