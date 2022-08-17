import type { Readable } from 'stream';
import stream from 'stream';

import ft from 'file-type';
import sharp from 'sharp';
import isSvg from 'is-svg';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IMediaService, ResizeResult } from '../../sdk/types/IMediaService';

/* eslint-disable  @typescript-eslint/no-var-requires */
const ExifTransformer = require('exif-be-gone');
/* eslint-enable  @typescript-eslint/no-var-requires */

export class MediaService extends ServiceClassInternal implements IMediaService {
	protected name = 'media';

	private imageExts = new Set([
		'jpg',
		'png',
		'gif',
		'webp',
		'flif',
		'cr2',
		'tif',
		'bmp',
		'jxr',
		'psd',
		'ico',
		'bpg',
		'jp2',
		'jpm',
		'jpx',
		'heic',
		'cur',
		'dcm',
	]);

	async resizeFromBuffer(
		input: Buffer,
		width: number,
		height: number,
		keepType: boolean,
		blur: boolean,
		enlarge: boolean,
		fit?: keyof sharp.FitEnum | undefined,
	): Promise<ResizeResult> {
		const stream = this.bufferToStream(input);
		return this.resizeFromStream(stream, width, height, keepType, blur, enlarge, fit);
	}

	async resizeFromStream(
		input: stream.Stream,
		width: number,
		height: number,
		keepType: boolean,
		blur: boolean,
		enlarge: boolean,
		fit?: keyof sharp.FitEnum | undefined,
	): Promise<ResizeResult> {
		const transformer = sharp().resize({ width, height, fit, withoutEnlargement: !enlarge });

		if (!keepType) {
			transformer.jpeg();
		}

		if (blur) {
			transformer.blur();
		}

		const result = transformer.toBuffer({ resolveWithObject: true });
		input.pipe(transformer);

		const {
			data,
			info: { width: widthInfo, height: heightInfo },
		} = await result;
		return {
			data,
			width: widthInfo,
			height: heightInfo,
		};
	}

	async isImage(buff: Buffer): Promise<boolean> {
		const data = await ft.fromBuffer(buff);
		if (!data?.ext) {
			return false || this.isSvgImage(buff);
		}
		return this.imageExts.has(data.ext) || this.isSvgImage(buff);
	}

	isSvgImage(buff: Buffer): boolean {
		return isSvg(buff);
	}

	stripExifFromBuffer(buffer: Buffer): Promise<Buffer> {
		return this.streamToBuffer(this.stripExifFromImageStream(this.bufferToStream(buffer)));
	}

	stripExifFromImageStream(stream: stream.Stream): Readable {
		return stream.pipe(new ExifTransformer());
	}

	private bufferToStream(buffer: Buffer): stream.PassThrough {
		const bufferStream = new stream.PassThrough();
		bufferStream.end(buffer);
		return bufferStream;
	}

	private streamToBuffer(stream: stream.Stream): Promise<Buffer> {
		return new Promise((resolve) => {
			const chunks: Array<Buffer> = [];
			stream.on('data', (data) => chunks.push(data)).on('end', () => resolve(Buffer.concat(chunks)));
		});
	}
}
