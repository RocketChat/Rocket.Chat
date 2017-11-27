RocketChat.API.v1.addRoute('rooms.get', { authRequired: true }, {
	get: {
		//This is defined as such only to provide an example of how the routes can be defined :X
		action() {
			let updatedAt;

			if (typeof this.queryParams.updatedAt === 'string') {
				try {
					updatedAt = new Date(this.queryParams.updatedAt);

					if (updatedAt.toString() === 'Invalid Date') {
						return RocketChat.API.v1.failure('Invalid date for `updatedAt`');
					}
				} catch (error) {
					return RocketChat.API.v1.failure('Invalid date for `updatedAt`');
				}
			}

			return Meteor.runAsUser(this.userId, () => {
				return RocketChat.API.v1.success(Meteor.call('rooms/get', updatedAt));
			});
		}
	}
});

RocketChat.API.v1.addRoute('rooms.upload/:rid', { authRequired: true }, {
	post() {
		const room = Meteor.call('canAccessRoom', this.urlParams.rid, this.userId);

		if (!room) {
			return RocketChat.API.v1.unauthorized();
		}

		const Busboy = Npm.require('busboy');
		const busboy = new Busboy({ headers: this.request.headers });
		const files = [];
		const fields = {};

		Meteor.wrapAsync((callback) => {
			busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
				if (fieldname !== 'file') {
					return files.push(new Meteor.Error('invalid-field'));
				}

				const fileDate = [];
				file.on('data', data => fileDate.push(data));

				file.on('end', () => {
					files.push({ fieldname, file, filename, encoding, mimetype, fileBuffer: Buffer.concat(fileDate) });
				});
			});

			busboy.on('field', (fieldname, value) => fields[fieldname] = value);

			busboy.on('finish', Meteor.bindEnvironment(() => callback()));

			this.request.pipe(busboy);
		})();

		if (files.length === 0) {
			return RocketChat.API.v1.failure('File required');
		}

		if (files.length > 1) {
			return RocketChat.API.v1.failure('Just 1 file is allowed');
		}

		const file = files[0];

		const fileStore = FileUpload.getStore('Uploads');

		const details = {
			name: file.filename,
			size: file.fileBuffer.length,
			type: file.mimetype,
			rid: this.urlParams.rid
		};

		Meteor.runAsUser(this.userId, () => {
			const uploadedFile = Meteor.wrapAsync(fileStore.insert.bind(fileStore))(details, file.fileBuffer);

			uploadedFile.description = fields.description;

			delete fields.description;

			RocketChat.API.v1.success(Meteor.call('sendFileMessage', this.urlParams.rid, null, uploadedFile, fields));
		});

		return RocketChat.API.v1.success();
	}
});
