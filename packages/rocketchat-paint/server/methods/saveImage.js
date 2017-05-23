var dataURItoBuffer = function (dataURI) {
	return new Buffer(dataURI.split(',')[1], 'base64');
	// // convert base64/URLEncoded data component to raw binary data held in a string
	// var byteString;
	// if (dataURI.split(',')[0].indexOf('base64') >= 0)
	//     byteString = atob(dataURI.split(',')[1]);
	// else
	//     byteString = unescape(dataURI.split(',')[1]);

	// // separate out the mime component
	// var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

	// // write the bytes of the string to a typed array
	// var ia = new Uint8Array(byteString.length);
	// for (var i = 0; i < byteString.length; i++) {
	//     ia[i] = byteString.charCodeAt(i);
	// }

	// return new Blob([ia], {type:mimeString});
}


Meteor.methods({
	saveImage: function (image, data) {
		if (!this.userId) return {
			succes: false,
			reason: 'Not allowed.',
		};

		var iid = Images.insert(image);

		var future = new Future();


		S3.putObject({
			Bucket: Meteor.settings.s3.bucket,
			ACL: 'public-read',
			Key: 'images/' + iid,
			ContentType: 'image/png',
			Body: dataURItoBuffer(data),//new Buffer(blob, 'binary'),
		}, function (err, data) {
			if (err) {
				future.return({
					succes: false,
					reason: 'File server error.',
					details: {
						error: err,
						data: data,
					},
				});
			} else {
				future.return({
					success: true,
					imageId: iid,
				});
			}
		});

		return future.wait();
	},

});



