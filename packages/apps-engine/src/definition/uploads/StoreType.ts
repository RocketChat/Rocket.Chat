/**
 * The backend the workspace stores uploaded files in, chosen by the
 * administrator rather than by the App.
 */
export enum StoreType {
	GridFS = 'GridFS:Uploads',
	AmazonS3 = 'AmazonS3',
	GoogleCloudStorage = 'GoogleCloudStorage',
	Webdav = 'Webdav',
	FileSystem = 'FileSystem',
}
