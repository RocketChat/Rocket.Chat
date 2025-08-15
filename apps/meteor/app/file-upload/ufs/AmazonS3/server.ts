import stream from 'stream';

import {
	DeleteObjectCommand,
	GetObjectCommand,
	S3Client,
	type GetObjectCommandInput,
	type PutObjectCommandInput,
	type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { IUpload } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { check } from 'meteor/check';
import type { OptionalId } from 'mongodb';
import _ from 'underscore';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { UploadFS } from '../../../../server/ufs';
import type { StoreOptions } from '../../../../server/ufs/ufs-store';

export type S3Options = StoreOptions & {
	connection: S3ClientConfig;
	params: {
		Bucket: string;
		ACL: string;
	};
	URLExpiryTimeSpan: number;
	getPath: (file: OptionalId<IUpload>) => string;
};

class AmazonS3Store extends UploadFS.Store {
	protected getPath: (file: IUpload) => string;

	constructor(options: S3Options) {
		// Default options
		// options.secretAccessKey,
		// options.accessKeyId,
		// options.region,
		// options.sslEnabled // optional

		options = _.extend(
			{
				httpOptions: {
					timeout: 6000,
					agent: false,
				},
			},
			options,
		);

		super(options);

		const classOptions = options;

		const s3 = new S3Client(options.connection);

		options.getPath =
			options.getPath ||
			function (file) {
				return file._id;
			};

		this.getPath = function (file) {
			if (file.AmazonS3) {
				return file.AmazonS3.path;
			}
			// Compatibility
			// TODO: Migration
			if (file.s3) {
				return file.s3.path + file._id;
			}

			return file._id;
		};

		this.getRedirectURL = async (file, forceDownload = false) => {
			return getSignedUrl(
				s3,
				new GetObjectCommand({
					Key: this.getPath(file),
					ResponseContentDisposition: `${forceDownload ? 'attachment' : 'inline'}; filename="${encodeURI(file.name || '')}"`,
					Bucket: classOptions.params.Bucket,
				}),
				{
					expiresIn: classOptions.URLExpiryTimeSpan, // seconds
				},
			);
		};

		/**
		 * Creates the file in the collection
		 */
		this.create = async (file) => {
			check(file, Object);

			if (file._id == null) {
				file._id = Random.id();
			}

			file.AmazonS3 = {
				path: classOptions.getPath(file),
			};

			file.store = this.options.name; // assign store to file

			return (await this.getCollection().insertOne(file)).insertedId;
		};

		/**
		 * Removes the file
		 */
		this.delete = async function (fileId) {
			const file = await this.getCollection().findOne({ _id: fileId });
			if (!file) {
				throw new Error('File not found');
			}

			try {
				return await s3.send(
					new DeleteObjectCommand({
						Key: this.getPath(file),
						Bucket: classOptions.params.Bucket,
					}),
				);
			} catch (error) {
				SystemLogger.error(error);
			}
		};

		/**
		 * Returns the file read stream
		 */
		this.getReadStream = async function (_fileId, file, options = {}) {
			const params: GetObjectCommandInput = {
				Key: this.getPath(file),
				Bucket: classOptions.params.Bucket,
			};

			if (options.start && options.end) {
				params.Range = `bytes=${options.start}-${options.end}`;
			}

			const response = await s3.send(new GetObjectCommand(params));

			if (!response.Body) {
				throw new Error('File not found');
			}

			// If the response is a stream, return it directly
			if (!('readable' in response.Body)) {
				throw new Error('Response body is not a readable stream');
			}

			return response.Body;
		};

		/**
		 * Returns the file write stream
		 */
		this.getWriteStream = async function (_fileId, file /* , options*/) {
			const writeStream = new stream.PassThrough();

			writeStream.on('newListener', (event, listener) => {
				if (event === 'finish') {
					process.nextTick(() => {
						writeStream.removeListener(event, listener);
						writeStream.on('real_finish', listener);
					});
				}
			});

			// Use Upload class for streaming uploads with AWS SDK v3
			const uploadParams: PutObjectCommandInput = {
				Key: this.getPath(file),
				Body: writeStream,
				Bucket: classOptions.params.Bucket,
			};

			// Only set ContentType if it's defined
			if (file.type) {
				uploadParams.ContentType = file.type;
			}

			// Only set ContentLength if file.size is defined and not null
			if (file.size) {
				uploadParams.ContentLength = file.size;
			}

			const upload = new Upload({
				client: s3,
				params: uploadParams,
			});

			upload
				.done()
				.then(() => {
					writeStream.emit('real_finish');
				})
				.catch((error) => {
					SystemLogger.error(error);
					writeStream.emit('error', error);
				});

			return writeStream;
		};
	}
}

// Add store to UFS namespace
UploadFS.store.AmazonS3 = AmazonS3Store;
