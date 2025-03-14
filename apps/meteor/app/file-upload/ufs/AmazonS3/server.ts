import stream from 'stream';
import type { ReadableStream } from 'stream/web';

import { S3, GetObjectCommand } from '@aws-sdk/client-s3';
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
	connection: {
		accessKeyId?: string;
		secretAccessKey?: string;
		endpoint?: string;
		signatureVersion: string;
		s3ForcePathStyle?: boolean;
		params: {
			Bucket: string;
			ACL: string;
		};
		region: string;
	};
	URLExpiryTimeSpan: number;
	getPath: (file: OptionalId<IUpload>) => string;
};

class AmazonS3Store extends UploadFS.Store {
	protected getPath: (file: IUpload) => string;

	private bucketName: string;

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

		this.bucketName = options.connection.params.Bucket;

		const classOptions = options;

		const s3 = new S3(options.connection);

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
			const getObject = new GetObjectCommand({
				Key: this.getPath(file),
				Bucket: this.bucketName,
				ResponseContentDisposition: `${forceDownload ? 'attachment' : 'inline'}; filename="${encodeURI(file.name || '')}"`,
			});

			return getSignedUrl(s3, getObject, { expiresIn: classOptions.URLExpiryTimeSpan });
		};

		/**
		 * Creates the file in the collection
		 * @param file
		 * @param callback
		 * @return {string}
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
		 * @param fileId
		 * @param callback
		 */
		this.delete = async function (fileId) {
			const file = await this.getCollection().findOne({ _id: fileId });
			if (!file) {
				throw new Error('File not found');
			}
			const params = {
				Key: this.getPath(file),
				Bucket: classOptions.connection.params.Bucket,
			};

			try {
				return s3.deleteObject(params);
			} catch (err: any) {
				SystemLogger.error(err);
			}
		};

		/**
		 * Returns the file read stream
		 * @param fileId
		 * @param file
		 * @param options
		 * @return {*}
		 */
		this.getReadStream = async function (_fileId, file, options = {}) {
			const params: {
				Key: string;
				Bucket: string;
				Range?: string;
			} = {
				Key: this.getPath(file),
				Bucket: classOptions.connection.params.Bucket,
			};

			if (options.start && options.end) {
				params.Range = `${options.start} - ${options.end}`;
			}

			const { Body: body } = await s3.getObject(params);
			if (!body) {
				throw new Error('failed to get object from s3');
			}

			return stream.Readable.fromWeb(body.transformToWebStream() as ReadableStream);
		};

		/**
		 * Returns the file write stream
		 * @param fileId
		 * @param file
		 * @param options
		 * @return {*}
		 */
		this.getWriteStream = async function (_fileId, file /* , options*/) {
			const writeStream = new stream.PassThrough();
			// TS does not allow but S3 requires a length property;
			(writeStream as unknown as any).length = file.size;

			writeStream.on('newListener', (event, listener) => {
				if (event === 'finish') {
					process.nextTick(() => {
						writeStream.removeListener(event, listener);
						writeStream.on('real_finish', listener);
					});
				}
			});

			s3.putObject(
				{
					Key: this.getPath(file),
					Body: writeStream,
					ContentType: file.type,
					Bucket: classOptions.connection.params.Bucket,
				},
				(error) => {
					if (error) {
						SystemLogger.error(error);
					}

					writeStream.emit('real_finish');
				},
			);

			return writeStream;
		};
	}
}

// Add store to UFS namespace
UploadFS.store.AmazonS3 = AmazonS3Store;
