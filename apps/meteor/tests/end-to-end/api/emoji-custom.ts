import type { IEmojiCustom } from '@rocket.chat/core-typings';
import { assert, expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { imgURL } from '../../data/interactions';
import { updateSetting } from '../../data/permissions.helper';

describe('[EmojiCustom]', () => {
	const customEmojiName = `my-custom-emoji-${Date.now()}`;

	let withoutAliases: IEmojiCustom;

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

	let createdCustomEmoji: IEmojiCustom;

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

					const _createdCustomEmoji = (res.body.emojis.update as IEmojiCustom[]).find((emoji) => emoji.name === customEmojiName);
					const _withoutAliases = (res.body.emojis.update as IEmojiCustom[]).find(
						(emoji) => emoji.name === `${customEmojiName}-without-aliases`,
					);

					assert.isDefined(_createdCustomEmoji);
					assert.isDefined(_withoutAliases);

					createdCustomEmoji = _createdCustomEmoji;
					withoutAliases = _withoutAliases;
				})
				.end(done);
		});
		describe('successfully:', () => {
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

			it('should change the etag when the custom emoji image is updated', async () => {
				const prevEtag = createdCustomEmoji.etag;

				await request
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
					});

				const emojis = await request.get(api(`emoji-custom.all`)).set(credentials).expect(200);
				const updatedCustomEmoji = emojis.body.emojis.find((emoji: IEmojiCustom) => emoji._id === createdCustomEmoji._id);
				expect(updatedCustomEmoji.etag).not.to.be.equal(prevEtag);
			});
		});

		describe('should throw error when:', () => {
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
			it('the emoji file field is wrong', (done) => {
				void request
					.post(api('emoji-custom.update'))
					.set(credentials)
					.attach('emojiwrong', imgURL)
					.field({
						_id: createdCustomEmoji._id,
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
				.query({ _updatedAt: new Date().toISOString() })
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
				.query({ _updatedAt: new Date().toISOString(), updatedSince: new Date().toISOString() })
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
		it('should return only filtered by name emojis', (done) => {
			void request
				.get(api('emoji-custom.all'))
				.set(credentials)
				.query({
					name: `${customEmojiName}-without-aliases`,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('emojis').and.to.be.an('array').and.to.have.lengthOf(1);
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
	});

	describe('Accessing custom emojis', () => {
		let uploadDate: string | undefined;

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

		it('should return the emoji even when no etag is passed (for old emojis)', async () => {
			const res = await request.get(`/emoji-custom/${createdCustomEmoji.name}.png`).set(credentials).expect(200);

			expect(res.headers).to.have.property('content-type', 'image/png');
			expect(res.headers).to.have.property('cache-control', 'public, max-age=31536000');
			expect(res.headers).to.have.property('content-disposition', 'inline');
		});

		it('should return success if the etag is invalid', async () => {
			const res = await request
				.get(`/emoji-custom/${createdCustomEmoji.name}.png?etag=1234`)
				.set(credentials)
				.set({
					'if-none-match': 'invalid-etag',
				})
				.expect(200);

			expect(res.headers).to.have.property('content-type', 'image/png');
			expect(res.headers).to.have.property('cache-control', 'public, max-age=31536000');
			expect(res.headers).to.have.property('content-disposition', 'inline');
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
					expect(res.body.error).to.be.equal("must have required property 'emojiId'");
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

	describe('Emoji storage settings reactivity', () => {
		const normalizeSvg = (svg: string) => svg.replace(/\r\n/g, '\n').trim();

		const now = Date.now();
		const fsEmojiName = `emoji-fs-${now}`;
		const gridFsEmojiName = `emoji-gridfs-${now}`;
		const svgFallback = normalizeSvg(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" pointer-events="none" width="50" height="50" style="width: 50px; height: 50px; background-color: #000;">
	<text text-anchor="middle" y="50%" x="50%" dy="0.36em" pointer-events="auto" fill="#ffffff" font-family="Helvetica, Arial, Lucida Grande, sans-serif" style="font-weight: 400; font-size: 28px;">
		?
	</text>
</svg>`);

		before(async () => {
			await updateSetting('EmojiUpload_FileSystemPath', '', false);
			await updateSetting('EmojiUpload_Storage_Type', 'FileSystem');
			await request.post(api('emoji-custom.create')).set(credentials).attach('emoji', imgURL).field({ name: fsEmojiName }).expect(200);

			await updateSetting('EmojiUpload_Storage_Type', 'GridFS');
			await request.post(api('emoji-custom.create')).set(credentials).attach('emoji', imgURL).field({ name: gridFsEmojiName }).expect(200);
		});

		after(async () => {
			const list = await request.get(api('emoji-custom.all')).set(credentials);
			const fsEmoji = list.body.emojis.find((e: IEmojiCustom) => e.name === fsEmojiName);
			const gridEmoji = list.body.emojis.find((e: IEmojiCustom) => e.name === gridFsEmojiName);

			await updateSetting('EmojiUpload_Storage_Type', 'FileSystem', false);
			await updateSetting('EmojiUpload_FileSystemPath', '');
			if (fsEmoji) {
				await request.post(api('emoji-custom.delete')).set(credentials).send({ emojiId: fsEmoji._id });
			}

			await updateSetting('EmojiUpload_Storage_Type', 'GridFS');
			if (gridEmoji) {
				await request.post(api('emoji-custom.delete')).set(credentials).send({ emojiId: gridEmoji._id });
			}
		});

		describe('EmojiUpload_Storage_Type', () => {
			describe('when storage is GridFs', () => {
				before(async () => {
					await updateSetting('EmojiUpload_Storage_Type', 'GridFS');
				});

				it('should resolve GridFS files only', async () => {
					await request
						.get(`/emoji-custom/${fsEmojiName}.png`)
						.set(credentials)
						.expect(200)
						.expect((res) => {
							const received = normalizeSvg(res.body.toString());
							expect(received).to.equal(svgFallback);
						});
					await request
						.get(`/emoji-custom/${gridFsEmojiName}.png`)
						.set(credentials)
						.expect(200)
						.expect((res) => expect(res.headers).to.have.property('content-type', 'image/png'));
				});
			});

			describe('when storage is FileSystem', () => {
				before(async () => {
					await updateSetting('EmojiUpload_Storage_Type', 'FileSystem');
				});

				it('should resolve FileSystem files only', async () => {
					await request
						.get(`/emoji-custom/${fsEmojiName}.png`)
						.set(credentials)
						.expect(200)
						.expect((res) => expect(res.headers).to.have.property('content-type', 'image/png'));
					await request
						.get(`/emoji-custom/${gridFsEmojiName}.png`)
						.set(credentials)
						.expect(200)
						.expect((res) => {
							const received = normalizeSvg(res.body.toString());
							expect(received).to.equal(svgFallback);
						});
				});
			});
		});

		describe('EmojiUpload_FileSystemPath', () => {
			before(async () => {
				await updateSetting('EmojiUpload_Storage_Type', 'FileSystem');
			});

			describe('when file system path is the default one', () => {
				before(async () => {
					await updateSetting('EmojiUpload_FileSystemPath', '');
				});

				it('should resolve files', async () => {
					await request
						.get(`/emoji-custom/${fsEmojiName}.png`)
						.set(credentials)
						.expect(200)
						.expect((res) => expect(res.headers).to.have.property('content-type', 'image/png'));
				});
			});

			describe('when file system path is NOT the default one', () => {
				before(async () => {
					await updateSetting('EmojiUpload_FileSystemPath', '~/emoji-test');
				});

				after(async () => {
					await updateSetting('CustomSounds_FileSystemPath', '');
				});

				it('should NOT resolve files', async () => {
					await request
						.get(`/emoji-custom/${fsEmojiName}.png`)
						.set(credentials)
						.expect(200)
						.expect((res) => {
							const received = normalizeSvg(res.body.toString());
							expect(received).to.equal(svgFallback);
						});
				});
			});
		});
	});
});
