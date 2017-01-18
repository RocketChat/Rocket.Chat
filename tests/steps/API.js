/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import supertest from 'supertest';
import {imgURL} from '../data/interactions.js';
import {publicChannelName, privateChannelName} from '../data/channel.js';
const request = supertest('http://localhost:3000');
const prefix = '/api/v1/';


import {username, email, password, adminUsername, adminEmail, adminPassword} from '../data/user.js';
const apiUsername = 'api'+username;
const apiEmail = 'api'+email;
const apiPublicChannelName= 'api'+publicChannelName;
const apiPrivateChannelName = 'api'+privateChannelName;
var targetUserId = undefined;
var channelId = undefined;
var groupId = undefined;
var messageId = undefined;
var directMessageId = undefined;
var integrationId = undefined;

function api(path) {
	return prefix + path;
}

function log(res) {
	console.log(res.req.path);
	console.log({
		body: res.body,
		headers: res.headers
	});
}

const credentials = {
	['X-Auth-Token']: undefined,
	['X-User-Id']: undefined
};

const login = {
	user: adminUsername,
	password: adminPassword
};


describe('API default', () => {
	// Required by mobile apps
	it('/info', (done) => {
		request.get('/api/info')
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('version');
				expect(res.body).to.have.deep.property('build.date');
				expect(res.body).to.have.deep.property('build.nodeVersion');
				expect(res.body).to.have.deep.property('build.arch');
				expect(res.body).to.have.deep.property('build.platform');
				expect(res.body).to.have.deep.property('build.osRelease');
				expect(res.body).to.have.deep.property('build.totalMemory');
				expect(res.body).to.have.deep.property('build.freeMemory');
				expect(res.body).to.have.deep.property('build.cpus');
			})
			.end(done);
	});
});

describe('API v1', () => {
	before((done) => {
		request.post(api('login'))
			.send(login)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				credentials['X-Auth-Token'] = res.body.data.authToken;
				credentials['X-User-Id'] = res.body.data.userId;
			})
			.end(done);
	});

	it('/login', () => {
		expect(credentials).to.have.property('X-Auth-Token').with.length.at.least(1);
		expect(credentials).to.have.property('X-User-Id').with.length.at.least(1);
	});

	it('/me', (done) => {
		request.get(api('me'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('_id', credentials['X-User-Id']);
				expect(res.body).to.have.property('username', login.user);
				expect(res.body).to.have.property('active');
				expect(res.body).to.have.property('name');
				expect(res.body).to.have.deep.property('emails[0].address', adminEmail);
			})
			.end(done);
	});

	describe('Users', () => {
		it('/users.create', (done) => {
			request.post(api('users.create'))
				.set(credentials)
				.send({
					email: apiEmail,
					name: apiUsername,
					username: apiUsername,
					password: password,
					active: true,
					roles: ['user'],
					joinDefaultChannels: true,
					verified:true
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('user.username', apiUsername);
					expect(res.body).to.have.deep.property('user.emails[0].address', apiEmail);
					expect(res.body).to.have.deep.property('user.active', true);
					expect(res.body).to.have.deep.property('user.name', apiUsername);
					targetUserId = res.body.user._id;
				})
				.end(done);
		});

		it('/users.info', (done) => {
			request.get(api('users.info'))
				.set(credentials)
				.query({
					userId: targetUserId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('user.username', apiUsername);
					expect(res.body).to.have.deep.property('user.emails[0].address', apiEmail);
					expect(res.body).to.have.deep.property('user.active', true);
					expect(res.body).to.have.deep.property('user.name', apiUsername);
				})
				.end(done);
		});

		it('/users.getPresence', (done) => {
			request.get(api('users.getPresence'))
				.set(credentials)
				.query({
					userId: targetUserId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('presence', 'offline');
				})
				.end(done);
		});

		it('/users.list', (done) => {
			request.get(api('users.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});

		it.skip('/users.list', (done) => {
		//filtering user list
			request.get(api('users.list'))
				.set(credentials)
				.query({
					name: { '$regex': 'g' }
				})
				.field('username', 1)
				.sort('createdAt', -1)
				.expect(log)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});



		it.skip('/users.setAvatar', (done) => {
			request.post(api('users.setAvatar'))
				.set(credentials)
				.attach('avatarUrl', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/users.update', (done) => {
			request.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUserId,
					data :{
						email: apiEmail,
						name: 'edited'+apiUsername,
						username: 'edited'+apiUsername,
						password: password,
						active: true,
						roles: ['user']
					}
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('user.username', 'edited'+apiUsername);
					expect(res.body).to.have.deep.property('user.emails[0].address', apiEmail);
					expect(res.body).to.have.deep.property('user.active', true);
					expect(res.body).to.have.deep.property('user.name', 'edited'+apiUsername);
				})
				.end(done);
		});
	});

	describe('channels', () => {
		it('/channels.create', (done) => {
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: apiPublicChannelName
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'c');
					expect(res.body).to.have.deep.property('channel.msgs', 0);
					channelId = res.body.channel._id;
				})
				.end(done);
		});

		it('/channels.info', (done) => {
			request.get(api('channels.info'))
				.set(credentials)
				.query({
					roomId: channelId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'c');
					expect(res.body).to.have.deep.property('channel.msgs', 0);
				})
				.end(done);
		});

		it('/chat.postMessage', (done) => {
			request.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					roomId: channelId,
					channel: apiPublicChannelName,
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
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('message.msg', 'Sample message');
					messageId = res.body.message._id;
				})
				.end(done);
		});

		it('/chat.update', (done) => {
			request.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: channelId,
					msgId: messageId,
					text: 'This message was edited via API'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('message.msg', 'This message was edited via API');
				})
				.end(done);
		});

		it('/channels.invite', (done) => {
			request.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: channelId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'c');
					expect(res.body).to.have.deep.property('channel.msgs', 1);
				})
				.end(done);
		});

		it('/channels.addModerator', (done) => {
			request.post(api('channels.addModerator'))
				.set(credentials)
				.send({
					roomId: channelId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/channels.removeModerator', (done) => {
			request.post(api('channels.removeModerator'))
				.set(credentials)
				.send({
					roomId: channelId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/channels.addOwner', (done) => {
			request.post(api('channels.addOwner'))
				.set(credentials)
				.send({
					roomId: channelId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/channels.removeOwner', (done) => {
			request.post(api('channels.removeOwner'))
				.set(credentials)
				.send({
					roomId: channelId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/channels.kick', (done) => {
			request.post(api('channels.kick'))
				.set(credentials)
				.send({
					roomId: channelId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'c');
					expect(res.body).to.have.deep.property('channel.msgs', 1);
				})
				.end(done);
		});

		it('/channels.invite', (done) => {
			request.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: channelId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'c');
					expect(res.body).to.have.deep.property('channel.msgs', 1);
				})
				.end(done);
		});

		it('/channels.addOwner', (done) => {
			request.post(api('channels.addOwner'))
				.set(credentials)
				.send({
					roomId: channelId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/channels.setDescription', (done) => {
			request.post(api('channels.setDescription'))
				.set(credentials)
				.send({
					roomId: channelId,
					description: 'this is a description for a channel for api tests'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('description', 'this is a description for a channel for api tests');
				})
				.end(done);
		});

		it('/channels.setTopic', (done) => {
			request.post(api('channels.setTopic'))
				.set(credentials)
				.send({
					roomId: channelId,
					topic: 'this is a topic of a channel for api tests'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('topic', 'this is a topic of a channel for api tests');
				})
				.end(done);
		});

		it('/channels.setPurpose', (done) => {
			request.post(api('channels.setPurpose'))
				.set(credentials)
				.send({
					roomId: channelId,
					purpose: 'this is a purpose of a channel for api tests'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('purpose', 'this is a purpose of a channel for api tests');
				})
				.end(done);
		});

		it('/channels.history', (done) => {
			request.get(api('channels.history'))
				.set(credentials)
				.query({
					roomId: channelId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages');
				})
				.end(done);
		});

		it('/channels.cleanHistory', (done) => {
			request.post(api('channels.cleanHistory'))
				.set(credentials)
				.send({
					roomId: channelId,
					latest: '2016-12-09T13:42:25.304Z',
					oldest: '2016-08-30T13:42:25.304Z'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/channels.archive', (done) => {
			request.post(api('channels.archive'))
				.set(credentials)
				.send({
					roomId: channelId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/channels.unarchive', (done) => {
			request.post(api('channels.unarchive'))
				.set(credentials)
				.send({
					roomId: channelId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/channels.close', (done) => {
			request.post(api('channels.close'))
				.set(credentials)
				.send({
					roomId: channelId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/channels.open', (done) => {
			request.post(api('channels.open'))
				.set(credentials)
				.send({
					roomId: channelId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/channels.list', (done) => {
			request.get(api('channels.list'))
				.set(credentials)
				.query({
					roomId: channelId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});

		it('/channels.list.joined', (done) => {
			request.get(api('channels.list.joined'))
				.set(credentials)
				.query({
					roomId: channelId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});

		it('/chat.delete', (done) => {
			request.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: channelId,
					msgId: messageId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/channels.rename', (done) => {
			request.post(api('channels.rename'))
				.set(credentials)
				.send({
					roomId: channelId,
					name: 'EDITED'+apiPublicChannelName
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', 'EDITED'+apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'c');
					expect(res.body).to.have.deep.property('channel.msgs', 1);
				})
				.end(done);
		});

		it('/channels.getIntegrations', (done) => {
			request.get(api('channels.getIntegrations'))
				.set(credentials)
				.query({
					roomId: channelId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count', 0);
					expect(res.body).to.have.property('total', 0);
				})
				.end(done);
		});

		it('/channels.addAll', (done) => {
			request.post(api('channels.addAll'))
				.set(credentials)
				.send({
					roomId: channelId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', 'EDITED'+apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'c');
					expect(res.body).to.have.deep.property('channel.msgs', 1);
				})
				.end(done);
		});

		it('/channels.setJoinCode', (done) => {
			request.post(api('channels.setJoinCode'))
				.set(credentials)
				.send({
					roomId: channelId,
					joinCode: '123'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', 'EDITED'+apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'c');
					expect(res.body).to.have.deep.property('channel.msgs', 1);
				})
				.end(done);
		});

		it('/channels.setReadOnly', (done) => {
			request.post(api('channels.setReadOnly'))
				.set(credentials)
				.send({
					roomId: channelId,
					readOnly: true
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', 'EDITED'+apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'c');
					expect(res.body).to.have.deep.property('channel.msgs', 1);
				})
				.end(done);
		});

		it('/channels.leave', (done) => {
			request.post(api('channels.leave'))
				.set(credentials)
				.send({
					roomId: channelId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', 'EDITED'+apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'c');
					expect(res.body).to.have.deep.property('channel.msgs', 1);
				})
				.end(done);
		});

		it('/channels.setType', (done) => {
			request.post(api('channels.setType'))
				.set(credentials)
				.send({
					roomId: channelId,
					type: 'p'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', 'EDITED'+apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'p');
					expect(res.body).to.have.deep.property('channel.msgs', 1);
				})
				.end(done);
		});
	});

	describe('groups', () => {
		it('/groups.create', (done) => {
			request.post(api('groups.create'))
				.set(credentials)
				.send({
					name: apiPrivateChannelName
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('group._id');
					expect(res.body).to.have.deep.property('group.name', apiPrivateChannelName);
					expect(res.body).to.have.deep.property('group.t', 'p');
					expect(res.body).to.have.deep.property('group.msgs', 0);
					groupId = res.body.group._id;
				})
				.end(done);
		});

		it('/groups.info', (done) => {
			request.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: groupId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('group._id');
					expect(res.body).to.have.deep.property('group.name', apiPrivateChannelName);
					expect(res.body).to.have.deep.property('group.t', 'p');
					expect(res.body).to.have.deep.property('group.msgs', 0);
				})
				.end(done);
		});

		it('/chat.postMessage', (done) => {
			request.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					roomId: groupId,
					channel: apiPrivateChannelName,
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
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('message.msg', 'Sample message');
					messageId = res.body.message._id;
				})
				.end(done);
		});

		it('/chat.update', (done) => {
			request.post(api('chat.update'))
				.set(credentials)
				.send({
					roomId: groupId,
					msgId: messageId,
					text: 'This message was edited via API'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('message.msg', 'This message was edited via API');
				})
				.end(done);
		});

		it('/groups.invite', (done) => {
			request.post(api('groups.invite'))
				.set(credentials)
				.send({
					roomId: groupId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('group._id');
					expect(res.body).to.have.deep.property('group.name', apiPrivateChannelName);
					expect(res.body).to.have.deep.property('group.t', 'p');
					expect(res.body).to.have.deep.property('group.msgs', 1);
				})
				.end(done);
		});

		it('/groups.addModerator', (done) => {
			request.post(api('groups.addModerator'))
				.set(credentials)
				.send({
					roomId: groupId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/groups.removeModerator', (done) => {
			request.post(api('groups.removeModerator'))
				.set(credentials)
				.send({
					roomId: groupId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/groups.addOwner', (done) => {
			request.post(api('groups.addOwner'))
				.set(credentials)
				.send({
					roomId: groupId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/groups.removeOwner', (done) => {
			request.post(api('groups.removeOwner'))
				.set(credentials)
				.send({
					roomId: groupId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/groups.kick', (done) => {
			request.post(api('groups.kick'))
				.set(credentials)
				.send({
					roomId: groupId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/groups.invite', (done) => {
			request.post(api('groups.invite'))
				.set(credentials)
				.send({
					roomId: groupId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('group._id');
					expect(res.body).to.have.deep.property('group.name', apiPrivateChannelName);
					expect(res.body).to.have.deep.property('group.t', 'p');
					expect(res.body).to.have.deep.property('group.msgs', 1);
				})
				.end(done);
		});

		it('/groups.addOwner', (done) => {
			request.post(api('groups.addOwner'))
				.set(credentials)
				.send({
					roomId: groupId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/groups.setDescription', (done) => {
			request.post(api('groups.setDescription'))
				.set(credentials)
				.send({
					roomId: groupId,
					description: 'this is a description for a channel for api tests'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('description', 'this is a description for a channel for api tests');
				})
				.end(done);
		});

		it('/groups.setTopic', (done) => {
			request.post(api('groups.setTopic'))
				.set(credentials)
				.send({
					roomId: groupId,
					topic: 'this is a topic of a channel for api tests'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('topic', 'this is a topic of a channel for api tests');
				})
				.end(done);
		});

		it('/groups.setPurpose', (done) => {
			request.post(api('groups.setPurpose'))
				.set(credentials)
				.send({
					roomId: groupId,
					purpose: 'this is a purpose of a channel for api tests'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('purpose', 'this is a purpose of a channel for api tests');
				})
				.end(done);
		});

		it('/groups.history', (done) => {
			request.get(api('groups.history'))
				.set(credentials)
				.query({
					roomId: groupId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages');
				})
				.end(done);
		});

		it('/groups.archive', (done) => {
			request.post(api('groups.archive'))
				.set(credentials)
				.send({
					roomId: groupId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/groups.unarchive', (done) => {
			request.post(api('groups.unarchive'))
				.set(credentials)
				.send({
					roomId: groupId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/groups.close', (done) => {
			request.post(api('groups.close'))
				.set(credentials)
				.send({
					roomId: groupId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/groups.open', (done) => {
			request.post(api('groups.open'))
				.set(credentials)
				.send({
					roomId: groupId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/groups.list', (done) => {
			request.get(api('groups.list'))
				.set(credentials)
				.query({
					roomId: groupId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});

		it('/chat.delete', (done) => {
			request.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: groupId,
					msgId: messageId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/groups.rename', (done) => {
			request.post(api('groups.rename'))
				.set(credentials)
				.send({
					roomId: groupId,
					name: 'EDITED'+apiPrivateChannelName
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('group._id');
					expect(res.body).to.have.deep.property('group.name', 'EDITED'+apiPrivateChannelName);
					expect(res.body).to.have.deep.property('group.t', 'p');
					expect(res.body).to.have.deep.property('group.msgs', 1);
				})
				.end(done);
		});

		it('/groups.getIntegrations', (done) => {
			request.get(api('groups.getIntegrations'))
				.set(credentials)
				.query({
					roomId: groupId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count', 0);
					expect(res.body).to.have.property('total', 0);
				})
				.end(done);
		});

		it('/groups.setReadOnly', (done) => {
			request.post(api('groups.setReadOnly'))
				.set(credentials)
				.send({
					roomId: groupId,
					readOnly: true
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it.skip('/groups.leave', (done) => {
			request.post(api('groups.leave'))
				.set(credentials)
				.send({
					roomId: groupId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/groups.setType', (done) => {
			request.post(api('groups.setType'))
				.set(credentials)
				.send({
					roomId: groupId,
					type: 'c'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('direct messages', () => {
		it('/chat.postMessage', (done) => {
			request.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'rocket.cat',
					text: 'This message was sent using the API'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('message.msg', 'This message was sent using the API');
					expect(res.body).to.have.deep.property('message.rid');
					directMessageId = res.body.message.rid;
				})
				.end(done);
		});

		it('/im.setTopic', (done) => {
			request.post(api('im.setTopic'))
				.set(credentials)
				.send({
					roomId: directMessageId,
					topic: 'a direct message with rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(log)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/im.history', (done) => {
			request.get(api('im.history'))
				.set(credentials)
				.query({
					roomId: directMessageId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(log)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages');
				})
				.end(done);
		});

		it('/im.list', (done) => {
			request.get(api('im.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});

		it('/im.list.everyone', (done) => {
			request.get(api('im.list.everyone'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});

		it('/im.close', (done) => {
			request.post(api('im.close'))
				.set(credentials)
				.send({
					roomId: directMessageId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(log)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/im.open', (done) => {
			request.post(api('im.open'))
				.set(credentials)
				.send({
					roomId: directMessageId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(log)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('integrations', () => {
		it('/integrations.create', (done) => {
			request.post(api('integrations.create'))
				.set(credentials)
				.send({
					type: 'webhook-outgoing',
					name: 'Guggy',
					enabled: true,
					username: 'rocket.cat',
					urls: ['http://text2gif.guggy.com/guggify'],
					scriptEnabled: false,
					channel: '#general',
					triggerWords: ['!guggy'],
					alias: 'guggy',
					avatar: 'http://res.guggy.com/logo_128.png',
					emoji: ':ghost:'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					integrationId = res.body.integration._id;
					expect(res.body).to.have.deep.property('integration.name', 'Guggy');
					expect(res.body).to.have.deep.property('integration.type', 'webhook-outgoing');
					expect(res.body).to.have.deep.property('integration.enabled', true);
					expect(res.body).to.have.deep.property('integration.username', 'rocket.cat');
				})
				.end(done);
		});

		it('/integrations.list', (done) => {
			request.get(api('integrations.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('items');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});

		it('/integrations.remove', (done) => {
			request.post(api('integrations.remove'))
				.set(credentials)
				.send({
					type: 'webhook-outgoing',
					integrationId: integrationId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('integration.name', 'Guggy');
					expect(res.body).to.have.deep.property('integration.type', 'webhook-outgoing');
					expect(res.body).to.have.deep.property('integration.enabled', true);
					expect(res.body).to.have.deep.property('integration.username', 'rocket.cat');
				})
				.end(done);
		});
	});
});
