/* globals FileUpload, fileUploadHandler:true */

fileUploadHandler = (meta, file, data) => {
	var storageType = RocketChat.settings.get('FileUpload_Storage_Type');

	if (FileUpload[storageType] !== undefined) {
		return new FileUpload[storageType](meta, file, data);
	}
};
