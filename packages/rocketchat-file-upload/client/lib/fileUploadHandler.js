fileUploadHandler = (meta, file, data) => {
	var storageType = RocketChat.settings.get('FileUpload_Storage_Type');
	if (storageType === 'GridFS') {
		return new FileUpload.GridFS(meta, file, data);
	} else if (storageType === 'AmazonS3') {
		return new FileUpload.S3(meta, file, data);
	}
};
