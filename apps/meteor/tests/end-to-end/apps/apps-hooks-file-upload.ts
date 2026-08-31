import type { IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, request, credentials, api } from '../../data/api-data';
import { appImplementsIPreFileUpload } from '../../data/apps/app-packages';
import { cleanupApps, installLocalTestPackage } from '../../data/apps/helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[Apps Hooks - File Upload]', () => {
	before((done) => getCredentials(done));

	describe('IPreFileUpload', () => {
		let room: IRoom;

		before(async () => {
			await cleanupApps();
			await installLocalTestPackage(appImplementsIPreFileUpload);
			room = await createRoom({ type: 'c', name: `file-upload-hook-${Date.now()}` }).then((res) => res.body.channel);
		});

		after(() => Promise.all([deleteRoom({ type: 'c' as const, roomId: room._id }), cleanupApps()]));

		it('should be capable of rejecting an upload based on app logic', async () => {
			const fileContents = 'I want to be rejected by the app';

			await request
				.post(api(`rooms.media/${room._id}`))
				.set(credentials)
				.attach('file', Buffer.from(fileContents), { filename: 'test-should-reject' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-app-prevented');
					expect(res.body).to.have.property('error').that.is.string(fileContents);
				});
		});

		it('should not prevent an unrelated file upload', async () => {
			const fileContents = 'I should not be rejected';

			await request
				.post(api(`rooms.media/${room._id}`))
				.set(credentials)
				.attach('file', Buffer.from(fileContents), { filename: 'test-file' })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});
	});
});
