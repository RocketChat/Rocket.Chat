import type { Readable, Stream } from 'node:stream';

import type { FitEnum } from 'sharp';

export type ResizeFit = keyof FitEnum;

export type ResizeResult = {
	data: Buffer;
	width: number;
	height: number;
};

export interface IMediaService {
	resizeFromBuffer(
		input: Buffer,
		width: number,
		height: number,
		keepType: boolean,
		blur: boolean,
		enlarge: boolean,
		fit?: ResizeFit | undefined,
	): Promise<ResizeResult>;
	resizeFromStream(
		input: Readable,
		width: number,
		height: number,
		keepType: boolean,
		blur: boolean,
		enlarge: boolean,
		fit?: ResizeFit | undefined,
	): Promise<ResizeResult>;
	isImage(buff: Buffer): Promise<boolean>;
	stripExifFromImageStream(stream: Stream): Readable;
	stripExifFromBuffer(buffer: Buffer): Promise<Buffer>;
}
