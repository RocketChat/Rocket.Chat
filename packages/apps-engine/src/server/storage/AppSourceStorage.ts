import type { IAppStorageItem } from './IAppStorageItem';

export abstract class AppSourceStorage {
    /**
     * Stores an app package (zip file) in the underlying
     * storage provided by the host
     *
     * @param item descriptor of the App
     * @param zip the app package file contents
     *
     * @returns the path in which the pacakge has been stored
     */
    public abstract store(item: IAppStorageItem, zip: Buffer): Promise<string>;

    /**
     * Fetches an app's package file contents
     *
     * @param item descriptor of the App
     *
     * @returns buffer containing the file contents of the app's package
     */
    public abstract fetch(item: IAppStorageItem): Promise<Buffer>;

    /**
     * Updates an app package (zip file) in the underlying
     * storage provided by the host
     *
     * @param item descriptor of the App
     * @param zip the app package file contents
     *
     * @returns the path in which the pacakge has been stored
     */
    public abstract update(item: IAppStorageItem, zip: Buffer): Promise<string>;

    /**
     *
     * @param item descriptor of the App
     */
    public abstract remove(item: IAppStorageItem): Promise<void>;
}
