import { promises as fs } from 'fs';

import { AppSourceStorage, IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

const tempPath = '/Users/douglasgubert/dev/rocket.chat/Rocket.Chat/apps-engine-files/';

export class AppFileSystemSourceStorage extends AppSourceStorage {
	public async store(item: IAppStorageItem, zip: Buffer): Promise<boolean> {
		await fs.writeFile(`${ tempPath + item.id }.zip`, zip);

		return true;
	}

	public async fetch(item: IAppStorageItem): Promise<Buffer> {
		return fs.readFile(`${ tempPath + item.id }.zip`);
	}

	public async update(id: string, zip: Buffer): Promise<boolean> {
		await fs.writeFile(`${ tempPath + id }.zip`, zip);
		return true;
	}

	public async remove(item: IAppStorageItem): Promise<boolean> {
		fs.unlink(`${ tempPath + item.id }.zip`);
		return true;
	}
}
