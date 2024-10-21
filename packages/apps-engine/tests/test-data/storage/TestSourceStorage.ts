import type { IAppStorageItem } from '../../../src/server/storage';
import { AppSourceStorage } from '../../../src/server/storage';

export class TestSourceStorage extends AppSourceStorage {
    public async store(item: IAppStorageItem, zip: Buffer): Promise<string> {
        return 'app_package_path';
    }

    public async fetch(item: IAppStorageItem): Promise<Buffer> {
        return Buffer.from('buffer');
    }

    public async update(item: IAppStorageItem, zip: Buffer): Promise<string> {
        return 'updated_path';
    }

    public async remove(item: IAppStorageItem): Promise<void> {
        // yup
    }
}
