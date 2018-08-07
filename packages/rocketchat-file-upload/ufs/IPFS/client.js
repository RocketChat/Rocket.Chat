import {UploadFS} from 'meteor/jalik:ufs';

export class IPFS extends UploadFS.Store {}

// Add store to UFS namespace
UploadFS.store.IPFS = IPFS;
