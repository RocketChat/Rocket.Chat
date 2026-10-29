import type { IAppServerOrchestrator, IAppUploadsConverter, IAppsUpload } from '@rocket.chat/apps';
import type { IUpload } from '@rocket.chat/core-typings';
import { Uploads } from '@rocket.chat/models';
import * as z from 'zod';

import { createUploadsCodec } from './codecs/uploads';

export class AppUploadsConverter implements IAppUploadsConverter {
	private readonly codec: ReturnType<typeof createUploadsCodec>;

	constructor(protected readonly orch: IAppServerOrchestrator) {
		this.orch = orch;
		this.codec = createUploadsCodec(orch);
	}

	async convertById(id: string): Promise<IAppsUpload | undefined> {
		const upload = await Uploads.findOneById(id);

		return this.convertToApp(upload);
	}

	async convertToApp(upload: undefined | null): Promise<undefined>;

	async convertToApp(upload: IUpload): Promise<IAppsUpload>;

	async convertToApp(upload: IUpload | undefined | null): Promise<IAppsUpload | undefined>;

	async convertToApp(upload: IUpload | undefined | null): Promise<IAppsUpload | undefined> {
		if (!upload) {
			return undefined;
		}

		return z.decodeAsync(this.codec, upload);
	}

	convertToRocketChat(upload: undefined | null): undefined;

	convertToRocketChat(upload: IAppsUpload): IUpload;

	convertToRocketChat(upload: IAppsUpload | undefined | null): IUpload | undefined;

	convertToRocketChat(upload: IAppsUpload | undefined | null): IUpload | undefined {
		if (!upload) {
			return undefined;
		}

		return z.encode(this.codec, upload);
	}
}
