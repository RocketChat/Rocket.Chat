/* globals FileUploadBase, UploadFS, fileUploadHandler:true */
/* exported fileUploadHandler */

fileUploadHandler = (directive, meta, file) => {
	const storageType = RocketChat.settings.get('FileUpload_Storage_Type');

	const storeName = `${ storageType }:${ directive }`;

	const store = UploadFS.getStore(storeName);

	if (store) {
		return new FileUploadBase(store, meta, file);
	}
};
