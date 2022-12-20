import { Users } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';

import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import type { IOmnichannelTranscriptService } from '../../../../apps/meteor/server/sdk/types/IOmnichannelTranscriptService';
import type { Upload, Message, QueueWorker } from '../../../../apps/meteor/server/sdk';

export class OmnichannelTranscript extends ServiceClass implements IOmnichannelTranscriptService {
	protected name = 'omnichannel-transcript';

	private rcUser: Required<Pick<IUser, '_id' | 'username' | 'name'>>;

	constructor(
		private readonly uploadService: typeof Upload,
		private readonly messageService: typeof Message,
		private readonly queueService: typeof QueueWorker,
	) {
		super();

		// your stuff
	}

	getConfig(): unknown {
		return null;
	}

	private async getRocketCatUser(): Promise<Required<Pick<IUser, '_id' | 'username' | 'name'>>> {
		// Cache the user
		if (this.rcUser) {
			return this.rcUser;
		}

		const u = await Users.findOneById<Required<Pick<IUser, '_id' | 'username' | 'name'>>>('rocket.cat', {
			projection: { _id: 1, username: 1, name: 1 },
		});
		if (!u) {
			throw new Error('Rocket.Chat user not found');
		}

		this.rcUser = u;
		return this.rcUser;
	}

	// You're the only one missing :troll:
	async requestTranscript(): Promise<void> {
		// Temporary while we implement the actual logic :)
		await this.queueService.queueWork('work', 'pdf-worker.renderToStream', {
			template: 'omnichannel-transcript',
			details: { userId: 'rocket.cat', rid: 'GENERAL', from: this.name },
			data: { some: 'data' },
		});
	}

	async pdfComplete({ details, file }: any): Promise<void> {
		// Send the file to the livechat room where this was requested, to keep it in context
		try {
			await this.uploadService.sendFileMessage({
				roomId: details.rid,
				userId: details.userId,
				file,
				// @ts-expect-error - why?
				message: {
					msg: 'Your PDF has been generated!',
					rid: details.rid,
					u: await this.getRocketCatUser(),
				},
			});

			// Send the file to the user who requested it, so they can download it
			const { rid } = await this.messageService.createDirectMessage({ to: details.userId, from: 'rocket.cat' });
			await this.uploadService.sendFileMessage({
				roomId: rid,
				userId: 'rocket.cat',
				file,
				// @ts-expect-error - why?
				message: {
					msg: 'Your PDF has been generated!',
					rid,
					u: await this.getRocketCatUser(),
				},
			});
		} catch (e) {
			console.error('Error sending transcript as message', e);
		}
	}
}
