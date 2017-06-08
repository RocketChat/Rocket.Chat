import {UploadFS} from 'meteor/jalik:ufs';

export class AmazonS3Store extends UploadFS.Store {}

// Add store to UFS namespace
UploadFS.store.AmazonS3 = AmazonS3Store;
