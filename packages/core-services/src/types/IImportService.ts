import type { IImport, IImportUser, ImportStatus } from '@rocket.chat/core-typings';

export interface IImportService {
	clear(): Promise<void>;
	newOperation(userId: string, name: string, key: string): Promise<IImport>;
	status(): Promise<ImportStatus>;
	addUsers(users: Omit<IImportUser, '_id' | 'services' | 'customFields'>[]): Promise<void>;
	run(userId: string): Promise<void>;
}
