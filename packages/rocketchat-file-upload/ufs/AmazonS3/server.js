import {_} from 'meteor/underscore';
import {Meteor} from 'meteor/meteor';
import {UploadFS} from 'meteor/jalik:ufs';
import S3 from 'aws-sdk/clients/s3';
import stream from 'stream';

/**
 * AmazonS3 store
 * @param options
 * @constructor
 */
export class AmazonS3Store extends UploadFS.Store {

	constructor(options) {
		// Default options
		// options.secretAccessKey,
		// options.accessKeyId,
		// options.region,
		// options.sslEnabled // optional

		options = _.extend({
			httpOptions: {
				timeout: 6000,
				agent: false
			}
		}, options);

		super(options);

		const classOptions = options;

		if (Meteor.isServer) {
			const s3 = new S3(options.connection);

			this.getPath = function(file) {
				return `${ RocketChat.hostname }/${ file.rid }/${ file.userId }/${ file._id }`;
			};

			this.getS3URL = function(file) {
				const params = {
					Key: this.getPath(file),
					Expires: classOptions.URLExpiryTimeSpan
				};

				return s3.getSignedUrl('getObject', params);
			};

			/**
			 * Removes the file
			 * @param fileId
			 * @param callback
			 */
			this.delete = function(fileId, callback) {
				const file = this.getCollection().findOne({_id: fileId});
				const params = {
					Key: this.getPath(file)
				};

				s3.deleteObject(params, (err, data) => {
					if (err) {
						console.error(err);
					}

					callback && callback(err, data);
				});
			};

			/**
			 * Returns the file read stream
			 * @param fileId
			 * @param file
			 * @param options
			 * @return {*}
			 */
			this.getReadStream = function(fileId, file, options = {}) {
				const params = {
					Key: this.getPath(file)
				};

				if (options.start && options.end) {
					params.Range = `${ options.start } - ${ options.end }`;
				}

				return s3.getObject(params).createReadStream();
			};

			/**
			 * Returns the file write stream
			 * @param fileId
			 * @param file
			 * @param options
			 * @return {*}
			 */
			this.getWriteStream = function(fileId, file/*, options*/) {
				const writeStream = new stream.PassThrough();
				writeStream.length = file.size;

				writeStream.on('newListener', (event, listener) => {
					if (event === 'finish') {
						process.nextTick(() => {
							writeStream.removeListener(event, listener);
							writeStream.on('real_finish', listener);
						});
					}
				});

				s3.putObject({
					Key: this.getPath(file),
					Body: writeStream,
					ContentType: file.type

				}, (error) => {
					if (error) {
						console.error(error);
					}

					writeStream.emit('real_finish');
				});

				return writeStream;
			};
		}
	}
}

// Add store to UFS namespace
UploadFS.store.AmazonS3 = AmazonS3Store;
