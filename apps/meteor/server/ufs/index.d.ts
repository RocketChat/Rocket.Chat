export interface Store {
	getRedirectURL(file: IUpload, forceDownload?: true, callback?: (err: Error | null, fileUrl: string) => void): void;
}

export interface IUploadFS {
	getStore(name: 'AmazonS3:Uploads'): Store;
}

export declare const UploadFS: IUploadFS;
