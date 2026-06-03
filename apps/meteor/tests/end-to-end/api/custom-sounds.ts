import { randomUUID } from 'crypto';
import path from 'path';

import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updateSetting } from '../../data/permissions.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';

async function createCustomSound(fileName: string, filePath: string): Promise<string> {
	let fileId = '';

	await request
		.post(api('custom-sounds.create'))
		.set(credentials)
		.attach('sound', filePath)
		.field('name', fileName)
		.expect(200)
		.expect((res) => {
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('sound');
			fileId = res.body.sound._id;
		});

	return fileId;
}

async function deleteCustomSound(_id: string) {
	await request.post(api('custom-sounds.delete')).set(credentials).send({ _id }).expect(200);
}

describe('[CustomSounds]', () => {
	const fileName = `test-file-${randomUUID()}`;
	const mockWavAudioPath = path.resolve(__dirname, '../../mocks/files/audio_mock.wav');
	const mockMp3AudioPath = path.resolve(__dirname, '../../mocks/files/audio_mock.mp3');

	let fileId: string;
	let fileId2: string;
	let uploadDate: string | undefined;

	before((done) => getCredentials(done));

	before(async () => {
		fileId = await createCustomSound(fileName, mockWavAudioPath);
		fileId2 = await createCustomSound(`${fileName}-2`, mockWavAudioPath);
	});

	after(async () => {
		if (fileId) {
			await deleteCustomSound(fileId);
		}
		if (fileId2) {
			await deleteCustomSound(fileId2);
		}
	});

	describe('[/custom-sounds.create]', () => {
		let fileId3: string;

		after(async () => {
			if (fileId3) {
				await deleteCustomSound(fileId3);
			}
		});

		it('should successfully create a new custom sound and return its _id', async () => {
			const response = await request
				.post(api('custom-sounds.create'))
				.set(credentials)
				.attach('sound', mockWavAudioPath)
				.field('name', `happy-path-sound-${randomUUID()}`)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('sound').and.to.be.an('object');
					expect(res.body.sound).to.have.property('_id').and.to.be.a('string');
				});
			fileId3 = response.body.sound._id;
		});

		it('should not be able to create two sounds with the same name', async () => {
			await request
				.post(api('custom-sounds.create'))
				.set(credentials)
				.attach('sound', mockWavAudioPath)
				.field('name', fileName)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'The custom sound name is already in use [Custom_Sound_Error_Name_Already_In_Use]');
				});
		});

		it('should return unauthorized if not authenticated', async () => {
			await request.post(api('custom-sounds.create')).expect(401);
		});

		it('should fail if the file exceeds the 5MB size limit', async () => {
			const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 'a');

			await request
				.post(api('custom-sounds.create'))
				.set(credentials)
				.attach('sound', largeBuffer, { filename: 'large.wav', contentType: 'audio/wav' })
				.field('name', 'large-sound')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('error').and.to.be.equal('[error-file-too-large]');
				});
		});

		it('should fail if the file is an invalid mime type', async () => {
			await request
				.post(api('custom-sounds.create'))
				.set(credentials)
				.attach('sound', Buffer.from('this is not audio'), { filename: 'test.txt', contentType: 'text/plain' })
				.field('name', 'invalid-sound')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.equal('MIME type not allowed');
				});
		});

		it('should reject injection of invalid characters and symbols in name', async () => {
			await request
				.post(api('custom-sounds.create'))
				.set(credentials)
				.attach('sound', mockWavAudioPath)
				.field('name', '<script>alert("xss")</script>')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.include('is not a valid name');
				});
		});

		it('should reject NoSQL regex injection in name', async () => {
			await request
				.post(api('custom-sounds.create'))
				.set(credentials)
				.attach('sound', mockWavAudioPath)
				.field('name', '{"$regex":".*"}')
				.expect(400);
		});

		describe('without manage-sounds permission', () => {
			let unauthorizedUser: IUser;
			let unauthorizedUserCredentials: Credentials;

			before(async () => {
				unauthorizedUser = await createUser();
				unauthorizedUserCredentials = await login(unauthorizedUser.username, password);
			});

			after(async () => {
				await deleteUser(unauthorizedUser);
			});

			it('should return forbidden if user does not have the manage-sounds permission', async () => {
				await request
					.post(api('custom-sounds.create'))
					.set(unauthorizedUserCredentials)
					.attach('sound', mockWavAudioPath)
					.field('name', `forbidden-sound-${randomUUID()}`)
					.expect(403);
			});
		});
	});

	describe('[/custom-sounds.update]', () => {
		let previousFileName: string;

		before(async () => {
			await request
				.get(api('custom-sounds.getOne'))
				.set(credentials)
				.query({ _id: fileId })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('sound').and.to.be.an('object');
					previousFileName = res.body.sound.name;
				});
		});

		after(async () => {
			await request
				.post(api('custom-sounds.update'))
				.set(credentials)
				.field('_id', fileId)
				.field('name', previousFileName)
				.attach('sound', mockWavAudioPath)
				.expect(200);
		});

		it('should successfully update only the name of the sound without sending the file again', async () => {
			const newSoundName = `${fileName}-updated`;
			await request
				.post(api('custom-sounds.update'))
				.set(credentials)
				.field('_id', fileId)
				.field('name', newSoundName)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('custom-sounds.getOne'))
				.set(credentials)
				.query({ _id: fileId })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('sound').and.to.be.an('object');
					expect(res.body.sound).to.have.property('name').and.to.be.equal(newSoundName);
				});
		});

		it('should successfully update the sound file and name', async () => {
			const newSoundName = `${fileName}-2-updated`;
			await request
				.post(api('custom-sounds.update'))
				.set(credentials)
				.attach('sound', mockMp3AudioPath)
				.field('_id', fileId)
				.field('name', newSoundName)
				.expect(200);

			await request
				.get(api('custom-sounds.getOne'))
				.set(credentials)
				.query({ _id: fileId })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('sound').and.to.be.an('object');
					expect(res.body.sound).to.have.property('name').and.to.be.equal(newSoundName);
					expect(res.body.sound).to.have.property('extension').and.to.be.equal('mp3');
				});
		});

		it('should not be able to update sounds name if the name was already taken', async () => {
			await request
				.post(api('custom-sounds.update'))
				.set(credentials)
				.attach('sound', mockWavAudioPath)
				.field('_id', fileId)
				.field('name', `${fileName}-2`)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'The custom sound name is already in use [Custom_Sound_Error_Name_Already_In_Use]');
				});
		});

		it('should return unauthorized if not authenticated', async () => {
			await request.post(api('custom-sounds.update')).expect(401);
		});

		it('should reject injection of invalid characters and symbols in name', async () => {
			await request
				.post(api('custom-sounds.update'))
				.set(credentials)
				.attach('sound', mockWavAudioPath)
				.field('_id', fileId)
				.field('name', '<script>alert("xss")</script>')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.include('is not a valid name');
				});
		});

		it('should reject NoSQL regex injection in name', async () => {
			await request
				.post(api('custom-sounds.update'))
				.set(credentials)
				.attach('sound', mockWavAudioPath)
				.field('_id', fileId)
				.field('name', '{"$regex":".*"}')
				.expect(400);
		});

		it('should fail if the file exceeds the 5MB size limit', async () => {
			const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 'a');

			await request
				.post(api('custom-sounds.update'))
				.set(credentials)
				.attach('sound', largeBuffer, { filename: 'large.wav', contentType: 'audio/wav' })
				.field('_id', fileId)
				.field('name', 'large-sound')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('error').and.to.be.equal('[error-file-too-large]');
				});
		});

		it('should return an error when trying to update a non-existent sound', async () => {
			await request
				.post(api('custom-sounds.update'))
				.set(credentials)
				.field('_id', 'invalid-id-123')
				.field('name', 'new-name')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.equal('Custom Sound not found.');
				});
		});

		it('should fail if attempting to update with an invalid mime type file', async () => {
			await request
				.post(api('custom-sounds.update'))
				.set(credentials)
				.attach('sound', Buffer.from('fake-audio'), { filename: 'test.mp4', contentType: 'video/mp4' })
				.field('_id', fileId)
				.field('name', fileName)
				.expect(400)
				.expect((res) => {
					expect(res.body.error).to.equal('MIME type not allowed');
				});
		});

		describe('without manage-sounds permission', async () => {
			let unauthorizedUser: IUser;
			let unauthorizedUserCredentials: Credentials;

			before(async () => {
				unauthorizedUser = await createUser();
				unauthorizedUserCredentials = await login(unauthorizedUser.username, password);
			});

			after(async () => {
				await deleteUser(unauthorizedUser);
			});

			it('should return forbidden if user does not have the manage-sounds permission', async () => {
				await request
					.post(api('custom-sounds.update'))
					.set(unauthorizedUserCredentials)
					.attach('sound', mockWavAudioPath)
					.field('_id', fileId)
					.field('name', `forbidden-case`)
					.expect(403);
			});
		});
	});

	describe('[/custom-sounds.list]', () => {
		it('should return custom sounds', (done) => {
			void request
				.get(api('custom-sounds.list'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('sounds').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should return custom sounds even requested with count and offset params', (done) => {
			void request
				.get(api('custom-sounds.list'))
				.set(credentials)
				.expect(200)
				.query({
					count: 5,
					offset: 0,
				})
				.expect((res) => {
					expect(res.body).to.have.property('sounds').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should return custom sounds filtering it using the `name` parameter', (done) => {
			void request
				.get(api('custom-sounds.list'))
				.set(credentials)
				.expect(200)
				.query({
					name: `${fileName}-2`,
					count: 5,
					offset: 0,
				})
				.expect((res) => {
					expect(res.body).to.have.property('sounds').and.to.be.an('array');
					expect(res.body).to.have.property('total').to.equal(1);
					expect(res.body).to.have.property('offset').to.equal(0);
					expect(res.body).to.have.property('count').to.equal(1);
					expect(res.body.sounds[0]._id).to.be.equal(fileId2);
				})
				.end(done);
		});
	});

	describe('[/custom-sounds.delete]', () => {
		let soundToDeleteId: string;
		let soundDeleted: boolean = false;

		before(async () => {
			soundToDeleteId = await createCustomSound(`sound-to-delete-${randomUUID()}`, mockWavAudioPath);
		});

		after(async () => {
			if (soundToDeleteId && !soundDeleted) {
				await deleteCustomSound(soundToDeleteId);
			}
		});

		it('should return unauthorized if the user is not authenticated', async () => {
			await request.post(api('custom-sounds.delete')).send({ _id: soundToDeleteId }).expect(401);
		});

		it('should return a 400 if attempting to delete a sound that does not exist', async () => {
			await request
				.post(api('custom-sounds.delete'))
				.set(credentials)
				.send({ _id: 'invalid-non-existent-id' })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.equal('Custom_Sound_Error_Invalid_Sound');
				});
		});

		it('should reject requests with invalid parameter types', async () => {
			await request
				.post(api('custom-sounds.delete'))
				.set(credentials)
				.send({ _id: { $ne: null } })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		describe('without manage-sounds permission', async () => {
			let unauthorizedUser: IUser;
			let unauthorizedUserCredentials: Credentials;

			before(async () => {
				unauthorizedUser = await createUser();
				unauthorizedUserCredentials = await login(unauthorizedUser.username, password);
			});

			after(async () => {
				await deleteUser(unauthorizedUser);
			});

			it('should return forbidden if user does not have the manage-sounds permission', async () => {
				await request.post(api('custom-sounds.delete')).set(unauthorizedUserCredentials).send({ _id: soundToDeleteId }).expect(403);
			});
		});

		it('should successfully delete a custom sound when providing a valid _id', async () => {
			await request
				.post(api('custom-sounds.delete'))
				.set(credentials)
				.send({ _id: soundToDeleteId })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
			soundDeleted = true;
		});
	});

	describe('Accessing custom sounds', () => {
		it('should return forbidden if the there is no fileId on the url', (done) => {
			void request
				.get('/custom-sounds/')
				.set(credentials)
				.expect(403)
				.expect((res) => {
					expect(res.text).to.be.equal('Forbidden');
				})
				.end(done);
		});

		it('should return not found if the the requested file does not exists', (done) => {
			void request
				.get('/custom-sounds/invalid.mp3')
				.set(credentials)
				.expect(404)
				.expect((res) => {
					expect(res.text).to.be.equal('Not found');
				})
				.end(done);
		});

		it('should return success if the the requested exists', (done) => {
			void request
				.get(`/custom-sounds/${fileId}.wav`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.headers).to.have.property('last-modified');
					expect(res.headers).to.have.property('content-type', 'audio/wav');
					expect(res.headers).to.have.property('cache-control', 'public, max-age=0');
					expect(res.headers).to.have.property('expires', '-1');
					uploadDate = res.headers['last-modified'];
				})
				.end(done);
		});

		it('should return not modified if the the requested file contains a valid-since equal to the upload date', (done) => {
			void request
				.get(`/custom-sounds/${fileId}.wav`)
				.set(credentials)
				.set({
					'if-modified-since': uploadDate,
				})
				.expect(304)
				.expect((res) => {
					expect(res.headers).to.have.property('last-modified', uploadDate);
					expect(res.headers).not.to.have.property('content-type');
					expect(res.headers).not.to.have.property('cache-control');
					expect(res.headers).not.to.have.property('expires');
				})
				.end(done);
		});
	});

	describe('[/custom-sounds.getOne]', () => {
		it('should return unauthorized if not authenticated', async () => {
			await request.get(api('custom-sounds.getOne')).query({ _id: fileId }).expect(401);
		});

		it('should return not found if custom sound does not exist', async () => {
			await request.get(api('custom-sounds.getOne')).set(credentials).query({ _id: 'invalid-id' }).expect(404);
		});

		it('should return bad request if the _id length is not more than one', async () => {
			await request.get(api('custom-sounds.getOne')).set(credentials).query({ _id: '' }).expect(400);
		});

		it('should return the custom sound successfully', async () => {
			await request
				.get(api('custom-sounds.getOne'))
				.set(credentials)
				.query({ _id: fileId })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('sound').and.to.be.an('object');
					expect(res.body.sound).to.have.property('_id', fileId);
					expect(res.body.sound).to.have.property('name').and.to.be.a('string');
					expect(res.body.sound).to.have.property('extension').and.to.be.a('string');
				});
		});

		it('should reject regex injection via query object', async () => {
			await request
				.get(api('custom-sounds.getOne'))
				.set(credentials)
				.query({
					_id: { $regex: '.*' },
				})
				.expect(400);
		});

		it('should reject regex injection via bracket syntax', async () => {
			await request.get(api('custom-sounds.getOne')).set(credentials).query('_id[$regex]=.*').expect(400);
		});

		it('should reject encoded regex injection attempt', async () => {
			await request
				.get(api('custom-sounds.getOne'))
				.set(credentials)
				.query({
					_id: '{"$regex":".*"}',
				})
				.expect(404); // valid string, but it doesn't exist
		});
	});

	describe('Sounds storage settings reactivity', () => {
		let fsFileId: string;
		let gridFsFileId: string;

		before(async () => {
			await updateSetting('CustomSounds_FileSystemPath', '', false);

			await updateSetting('CustomSounds_Storage_Type', 'FileSystem');
			fsFileId = await createCustomSound(`${fileName}-3`, mockWavAudioPath);

			await updateSetting('CustomSounds_Storage_Type', 'GridFS');
			gridFsFileId = await createCustomSound(`${fileName}-4`, mockWavAudioPath);
		});

		after(async () => {
			await updateSetting('CustomSounds_Storage_Type', 'FileSystem', false);
			await updateSetting('CustomSounds_FileSystemPath', '');
			await deleteCustomSound(fsFileId);
			await updateSetting('CustomSounds_Storage_Type', 'GridFS');
			await deleteCustomSound(gridFsFileId);
		});

		describe('CustomSounds_Storage_Type', () => {
			describe('when storage is GridFS', () => {
				before(async () => {
					await updateSetting('CustomSounds_Storage_Type', 'GridFS');
				});

				it('should resolve GridFS files only', async () => {
					await request.get(`/custom-sounds/${gridFsFileId}.wav`).set(credentials).expect(200);
					await request.get(`/custom-sounds/${fsFileId}.wav`).set(credentials).expect(404);
				});
			});

			describe('when storage is FileSystem', () => {
				before(async () => {
					await updateSetting('CustomSounds_Storage_Type', 'FileSystem');
				});

				it('should resolve FileSystem files only', async () => {
					await request.get(`/custom-sounds/${gridFsFileId}.wav`).set(credentials).expect(404);
					await request.get(`/custom-sounds/${fsFileId}.wav`).set(credentials).expect(200);
				});
			});
		});

		describe('CustomSounds_FileSystemPath', () => {
			before(async () => {
				await updateSetting('CustomSounds_Storage_Type', 'FileSystem');
			});

			describe('when file system path is the default one', () => {
				it('should resolve files', async () => {
					await request.get(`/custom-sounds/${fsFileId}.wav`).set(credentials).expect(200);
				});
			});

			describe('when file system path is NOT the default one', () => {
				before(async () => {
					await updateSetting('CustomSounds_FileSystemPath', '~/sounds');
				});

				after(async () => {
					await updateSetting('CustomSounds_FileSystemPath', '');
				});

				it('should NOT resolve files', async () => {
					await request.get(`/custom-sounds/${fsFileId}.wav`).set(credentials).expect(404);
				});
			});
		});
	});
});
