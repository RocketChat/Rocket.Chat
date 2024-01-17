import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { imgURL } from '../../data/interactions';

const customEmojiName = `my-custom-emoji-${Date.now()}`;
let createdCustomEmoji;

describe('[EmojiCustom]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/emoji-custom.create]', () => {
		it('should create new custom emoji', (done) => {
			request
				.post(api('emoji-custom.create'))
				.set(credentials)
				.attach('emoji', imgURL)
				.field({
					name: customEmojiName,
					aliases: `${customEmojiName}-alias`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should create new custom emoji without optional parameter "aliases"', (done) => {
			request
				.post(api('emoji-custom.create'))
				.set(credentials)
				.attach('emoji', imgURL)
				.field({
					name: `${customEmojiName}-without-aliases`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should throw an error when the filename is wrong', (done) => {
			request
				.post(api('emoji-custom.create'))
				.set(credentials)
				.attach('emojiwrong', imgURL)
				.field({
					_id: 'invalid-id',
					name: 'my-custom-emoji-without-aliases',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('invalid-field');
				})
				.end(done);
		});
	});

	describe('[/emoji-custom.update]', () => {
		before((done) => {
			request
				.get(api('emoji-custom.list'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('emojis').and.to.be.a('object');
					expect(res.body.emojis).to.have.property('update').and.to.be.a('array').and.to.not.have.lengthOf(0);
					expect(res.body.emojis).to.have.property('remove').and.to.be.a('array').and.to.have.lengthOf(0);

					createdCustomEmoji = res.body.emojis.update.find((emoji) => emoji.name === customEmojiName);
				})
				.end(done);
		});
		it('successfully:', () => {
			it('should update the custom emoji without a file', (done) => {
				request
					.post(api('emoji-custom.update'))
					.set(credentials)
					.field({
						_id: createdCustomEmoji._id,
						name: customEmojiName,
						aliases: 'alias-my-custom-emoji',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
			it('should update the custom emoji without optional parameter "aliases"', (done) => {
				request
					.post(api('emoji-custom.update'))
					.set(credentials)
					.field({
						_id: createdCustomEmoji._id,
						name: customEmojiName,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
			it('should update the custom emoji with all parameters and with a file', (done) => {
				request
					.post(api('emoji-custom.update'))
					.set(credentials)
					.attach('emoji', imgURL)
					.field({
						_id: createdCustomEmoji._id,
						name: customEmojiName,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});
		it('should throw error when:', () => {
			it('the fields does not include "_id"', (done) => {
				request
					.post(api('emoji-custom.update'))
					.set(credentials)
					.attach('emoji', imgURL)
					.field({
						name: 'my-custom-emoji-without-aliases',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.errorType).to.be.equal('The required "_id" query param is missing.');
					})
					.end(done);
			});
			it('the custom emoji does not exists', (done) => {
				request
					.post(api('emoji-custom.update'))
					.set(credentials)
					.attach('emoji', imgURL)
					.field({
						_id: 'invalid-id',
						name: 'my-custom-emoji-without-aliases',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.errorType).to.be.equal('Emoji not found.');
					})
					.end(done);
			});
			it('the filename is wrong', (done) => {
				request
					.post(api('emoji-custom.update'))
					.set(credentials)
					.attach('emojiwrong', imgURL)
					.field({
						_id: 'invalid-id',
						name: 'my-custom-emoji-without-aliases',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.errorType).to.be.equal('invalid-field');
					})
					.end(done);
			});
		});
	});

	describe('[/emoji-custom.list]', () => {
		it('should return emojis', (done) => {
			request
				.get(api('emoji-custom.list'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('emojis').and.to.be.a('object');
					expect(res.body.emojis).to.have.property('update').and.to.be.a('array').and.to.not.have.lengthOf(0);
					expect(res.body.emojis).to.have.property('remove').and.to.be.a('array').and.to.have.lengthOf(0);
				})
				.end(done);
		});
		it('should return emojis when use "query" query parameter', (done) => {
			request
				.get(api(`emoji-custom.list?query={"_updatedAt": {"$gt": { "$date": "${new Date().toISOString()}" } } }`))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('emojis').and.to.be.a('object');
					expect(res.body.emojis).to.have.property('update').and.to.be.a('array').and.to.have.lengthOf(0);
					expect(res.body.emojis).to.have.property('remove').and.to.be.a('array').and.to.have.lengthOf(0);
				})
				.end(done);
		});
		it('should return emojis when use "updateSince" query parameter', (done) => {
			request
				.get(api(`emoji-custom.list?updatedSince=${new Date().toISOString()}`))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('emojis').and.to.be.a('object');
					expect(res.body.emojis).to.have.property('update').and.to.be.a('array').and.to.have.lengthOf(0);
					expect(res.body.emojis).to.have.property('remove').and.to.be.a('array').and.to.have.lengthOf(0);
				})
				.end(done);
		});
		it('should return emojis when use both, "updateSince" and "query" query parameter', (done) => {
			request
				.get(
					api(
						`emoji-custom.list?query={"_updatedAt": {"$gt": { "$date": "${new Date().toISOString()}" } }}&updatedSince=${new Date().toISOString()}`,
					),
				)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('emojis').and.to.be.a('object');
					expect(res.body.emojis).to.have.property('update').and.to.be.a('array').and.to.have.lengthOf(0);
					expect(res.body.emojis).to.have.property('remove').and.to.be.a('array').and.to.have.lengthOf(0);
				})
				.end(done);
		});
		it('should return an error when the "updateSince" query parameter is a invalid date', (done) => {
			request
				.get(api('emoji-custom.list?updatedSince=invalid-date'))
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-roomId-param-invalid');
				})
				.end(done);
		});
	});

	describe('[/emoji-custom.all]', () => {
		it('should return emojis', (done) => {
			request
				.get(api('emoji-custom.all'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('emojis').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should return emojis even requested with count and offset params', (done) => {
			request
				.get(api('emoji-custom.all'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('emojis').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
	});

	describe('Accessing custom emojis', () => {
		let uploadDate;

		it('should return forbidden if the there is no fileId on the url', (done) => {
			request
				.get('/emoji-custom/')
				.set(credentials)
				.expect(403)
				.expect((res) => {
					expect(res.text).to.be.equal('Forbidden');
				})
				.end(done);
		});

		it('should return success if the file does not exists with some specific headers', (done) => {
			request
				.get('/emoji-custom/invalid')
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.headers).to.have.property('last-modified', 'Thu, 01 Jan 2015 00:00:00 GMT');
					expect(res.headers).to.have.property('content-type', 'image/svg+xml');
					expect(res.headers).to.have.property('cache-control', 'public, max-age=0');
					expect(res.headers).to.have.property('expires', '-1');
					expect(res.headers).to.have.property('content-disposition', 'inline');
				})
				.end(done);
		});

		it('should return not modified if the file does not exists and if-modified-since is equal to the Thu, 01 Jan 2015 00:00:00 GMT', (done) => {
			request
				.get('/emoji-custom/invalid')
				.set(credentials)
				.set({
					'if-modified-since': 'Thu, 01 Jan 2015 00:00:00 GMT',
				})
				.expect(304)
				.expect((res) => {
					expect(res.headers).to.have.property('last-modified', 'Thu, 01 Jan 2015 00:00:00 GMT');
				})
				.end(done);
		});

		it('should return success if the the requested exists', (done) => {
			request
				.get(`/emoji-custom/${customEmojiName}.png`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.headers).to.have.property('last-modified');
					expect(res.headers).to.have.property('content-type', 'image/png');
					expect(res.headers).to.have.property('cache-control', 'public, max-age=31536000');
					expect(res.headers).to.have.property('content-disposition', 'inline');
					uploadDate = res.headers['last-modified'];
				})
				.end(done);
		});

		it('should return not modified if the the requested file contains a valid-since equal to the upload date', (done) => {
			request
				.get(`/emoji-custom/${customEmojiName}.png`)
				.set(credentials)
				.set({
					'if-modified-since': uploadDate,
				})
				.expect(304)
				.expect((res) => {
					expect(res.headers).to.have.property('last-modified', uploadDate);
					expect(res.headers).not.to.have.property('content-type');
					expect(res.headers).not.to.have.property('content-length');
					expect(res.headers).not.to.have.property('cache-control');
				})
				.end(done);
		});
	});

	describe('[/emoji-custom.delete]', () => {
		it('should throw an error when trying delete custom emoji without the required param "emojid"', (done) => {
			request
				.post(api('emoji-custom.delete'))
				.set(credentials)
				.send({})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('The "emojiId" params is required!');
				})
				.end(done);
		});
		it('should throw an error when trying delete custom emoji that does not exists', (done) => {
			request
				.post(api('emoji-custom.delete'))
				.set(credentials)
				.send({
					emojiId: 'invalid-id',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('Custom_Emoji_Error_Invalid_Emoji');
				})
				.end(done);
		});
		it('should delete the custom emoji created before successfully', (done) => {
			request
				.post(api('emoji-custom.delete'))
				.set(credentials)
				.send({
					emojiId: createdCustomEmoji._id,
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
