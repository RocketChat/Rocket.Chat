/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import {getCredentials, api, login, request, credentials, message, log, apiPrivateChannelName } from '../../data/api-data.js';
import {adminEmail, password} from '../../data/user.js';
import supertest from 'supertest';

describe('[Chat]', function() {
	this.retries(0);

	before(done => getCredentials(done));

	describe('/chat.postMessage', () => {

		it('should throw an error when at least one of required parameters(channel, roomId) is not sent', (done) => {
			request.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					text: 'Sample message',
					alias: 'Gruggy',
					emoji: ':smirk:',
					avatar: 'http://res.guggy.com/logo_128.png'
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'At least one, \'roomId\' or \'channel\' should be provided');
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
						fields: ''
					}]
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
							value: false
						}]
					}]
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
							value: 'Testing out something or other'
						}, {
							short: true,
							title: 'Another Test',
							value: '[Link](https://google.com/) something and this and that.'
						}]
					}]
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
					msgId: message._id
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
							title_link_download: 'https://rocket.chat/download',
							image_url: 'http://res.guggy.com/logo_128.png',
							audio_url: 'http://www.w3schools.com/tags/horse.mp3',
							video_url: 'http://www.w3schools.com/tags/movie.mp4',
							fields: [{
								short: true,
								title: 'Test',
								value: 'Testing out something or other'
							}, {
								short: true,
								title: 'Another Test',
								value: '[Link](https://google.com/) something and this and that.'
							}]
						}]
					}
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', 'Sample message');
				})
				.end(done);
		});
	});

	describe('/chat.update', () => {
		it('should update a message successfully', (done) => {
			request.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
					msgId: message._id,
					text: 'This message was edited via API'
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

	describe('/chat.search', () => {
		it('should return a list of messages when execute successfully', (done) => {
			request.get(api('chat.search'))
				.set(credentials)
				.query({
					roomId: 'GENERAL',
					searchText: 'This message was edited via API'
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

	describe('/chat.react', () => {
		it('should react a message successfully', (done) => {
			request.post(api('chat.react'))
				.set(credentials)
				.send({
					emoji: 'smile',
					messageId: message._id
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
