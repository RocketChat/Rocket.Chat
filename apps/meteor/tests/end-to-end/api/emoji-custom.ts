import type { ICustomEmojiDescriptor } from '@rocket.chat/core-typings';
import { assert, expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { imgURL } from '../../data/interactions';

describe('[EmojiCustom]', () => {
	const customEmojiName = `my-custom-emoji-${Date.now()}`;

	let withoutAliases: ICustomEmojiDescriptor;

	before((done) => getCredentials(done));

	after(() =>
		request.post(api('emoji-custom.delete')).set(credentials).send({
			emojiId: withoutAliases._id,
		}),
	);

	describe('[/emoji-custom.create]', () => {
		it('should create new custom emoji', (done) => {
			void request
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
			void request
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
			void request
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

	let createdCustomEmoji: ICustomEmojiDescriptor;

	describe('[/emoji-custom.update]', () => {
		before((done) => {
			void request
				.get(api('emoji-custom.list'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('emojis').and.to.be.a('object');
					expect(res.body.emojis).to.have.property('update').and.to.be.a('array').and.to.not.have.lengthOf(0);
					expect(res.body.emojis).to.have.property('remove').and.to.be.a('array').and.to.have.lengthOf(0);

					const _createdCustomEmoji = (res.body.emojis.update as ICustomEmojiDescriptor[]).find((emoji) => emoji.name === customEmojiName);
					const _withoutAliases = (res.body.emojis.update as ICustomEmojiDescriptor[]).find(
						(emoji) => emoji.name === `${customEmojiName}-without-aliases`,
					);

					assert.isDefined(_createdCustomEmoji);
					assert.isDefined(_withoutAliases);

					createdCustomEmoji = _createdCustomEmoji;
					withoutAliases = _withoutAliases;
				})
				.end(done);
		});
		it('successfully:', () => {
			it('should update the custom emoji without a file', (done) => {
				void request
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
				void request
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
				void request
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
				void request
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
				void request
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
				void request
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
			void request
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
			void request
				.get(api('emoji-custom.list'))
				.query({ query: `{ "_updatedAt": { "$gt": { "$date": "${new Date().toISOString()}" } } }` })
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
			void request
				.get(api('emoji-custom.list'))
				.query({ updatedSince: new Date().toISOString() })
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
			void request
				.get(api('emoji-custom.list'))
				.query({ query: `{"_updatedAt": {"$gt": { "$date": "${new Date().toISOString()}" } }}`, updatedSince: new Date().toISOString() })
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
			void request
				.get(api('emoji-custom.list'))
				.query({ updatedSince: 'invalid-date' })
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
			void request
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
			void request
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
		let uploadDate: unknown;

		it('should return forbidden if the there is no fileId on the url', (done) => {
			void request
				.get('/emoji-custom/')
				.set(credentials)
				.expect(403)
				.expect((res) => {
					expect(res.text).to.be.equal('Forbidden');
				})
				.end(done);
		});

		it('should return success if the file does not exists with some specific headers', (done) => {
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
