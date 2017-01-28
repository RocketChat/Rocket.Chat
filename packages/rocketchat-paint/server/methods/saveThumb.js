var dataURItoBuffer = function (dataURI) {
	return new Buffer(dataURI.split(',')[1], 'base64');
};

Meteor.methods({
	saveThumb: function (loc, data) {
		if (!this.userId) return {
			succes: false,
			reason: 'Not allowed.'
		};

		var img = dataURItoBuffer(data);

		var future = new Future();

		S3.putObject({
			Bucket: Meteor.settings.s3.bucket,
			ACL: 'public-read',
			Key: 'thumbs/' + loc.roomId + '/' + loc.boardId,
			ContentType: 'image/png',
			Body: img
		}, function (err, data) {
			if (err) {
				future.return({
					succes: false,
					reason: 'File server error.'
				});
			} else {
				S3.putObject({
					Bucket: Meteor.settings.s3.bucket,
					ACL: 'public-read',
					Key: 'thumbs/' + loc.roomId,
					ContentType: 'image/png',
					Body: img
				}, function (err, data) {
					if (err) {
						future.return({
							succes: false,
							reason: 'File server error.'
						});
					} else {
						future.return({
							success: true
						});
					}
				});
			}
		});

		return future.wait();
	}
});



