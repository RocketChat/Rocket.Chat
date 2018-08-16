import {UploadFS} from 'meteor/jalik:ufs';

export class GoogleStorageStore extends UploadFS.Store {}

// Add store to UFS namespace
UploadFS.store.GoogleStorage = GoogleStorageStore;
