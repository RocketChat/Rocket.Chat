/* globals FileUpload, fileUploadHandler:true */
/* exported fileUploadHandler */

fileUploadHandler = (meta, file, data) => {
	var storageType = 'AmazonS3';//RocketChat.settings.get('FileUpload_Storage_Type');

	if (FileUploader[storageType] !== undefined) {
		return new FileUploader[storageType](meta, file, data);
	}
};
