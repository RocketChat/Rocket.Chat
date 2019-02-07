import { UploadFS } from 'meteor/jalik:ufs';

export class WebdavStore extends UploadFS.Store {}

// Add store to UFS namespace
UploadFS.store.Webdav = WebdavStore;
