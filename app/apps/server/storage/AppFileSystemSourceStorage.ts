import { promises as fs } from 'fs';
import { join, normalize } from 'path';

import { AppSourceStorage, IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

export class AppFileSystemSourceStorage extends AppSourceStorage {
	private pathPrefix = 'fs:/';

	private path: string;

	public setPath(path: string): void {
		this.path = path;
	}

	public checkPath(): void {
		if (!this.path) {
			throw new Error('Invalid path configured for file system App storage');
		}
	}

	public async store(item: IAppStorageItem, zip: Buffer): Promise<string> {
		this.checkPath();

		const filePath = this.itemToFilename(item);

		await fs.writeFile(filePath, zip);

		return this.filenameToSourcePath(filePath);
	}

	public async fetch(item: IAppStorageItem): Promise<Buffer> {
		if (!item.sourcePath) {
			throw new Error('Invalid source path');
		}

		return fs.readFile(this.sourcePathToFilename(item.sourcePath));
	}

	public async update(item: IAppStorageItem, zip: Buffer): Promise<string> {
		this.checkPath();

		const filePath = this.itemToFilename(item);

		await fs.writeFile(filePath, zip);

		return this.filenameToSourcePath(filePath);
	}

	public async remove(item: IAppStorageItem): Promise<void> {
		if (!item.sourcePath) {
			return;
		}

		return fs.unlink(this.sourcePathToFilename(item.sourcePath));
	}

	private itemToFilename(item: IAppStorageItem): string {
		return `${normalize(join(this.path, item.id))}.zip`;
	}

	private filenameToSourcePath(filename: string): string {
		return this.pathPrefix + filename;
	}

	private sourcePathToFilename(sourcePath: string): string {
		return sourcePath.substring(this.pathPrefix.length);
	}
}
