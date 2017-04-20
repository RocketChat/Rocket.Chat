/* globals FileUpload, fileUploadHandler:true */
/* exported fileUploadHandler */

fileUploadHandler = (directive, meta, file) => {
	const storageType = RocketChat.settings.get('FileUpload_Storage_Type');

	if (FileUpload[storageType] !== undefined) {
		return new FileUpload[storageType](directive, meta, file);
	}
};
