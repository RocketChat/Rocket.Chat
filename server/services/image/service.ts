import { Readable } from 'stream';

import sharp from 'sharp';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import { IMediaService, ResizeResult } from '../../sdk/types/IMediaService';

export class MediaService extends ServiceClass implements IMediaService {
	protected name = 'media';

	resizeFromBuffer(input: Buffer, width: number, height: number, keepType: boolean, blur: boolean, enlarge: boolean, fit?: keyof sharp.FitEnum | undefined): Promise<ResizeResult> {
		const transformer = sharp(input)
			.resize({ width, height, fit, withoutEnlargement: !enlarge });

		if (!keepType) {
			transformer.jpeg();
		}

		if (blur) {
			transformer.blur();
		}

		return transformer.toBuffer({ resolveWithObject: true }).then(({ data, info: { width, height } }) => ({ data, width, height }));
	}

	resizeFromStream(input: Readable, width: number, height: number, keepType: boolean, blur: boolean, enlarge: boolean, fit?: keyof sharp.FitEnum | undefined): Promise<ResizeResult> {
		const transformer = sharp()
			.resize({ width, height, fit, withoutEnlargement: !enlarge });

		if (!keepType) {
			transformer.jpeg();
		}

		if (blur) {
			transformer.blur();
		}

		const result = transformer.toBuffer({ resolveWithObject: true }).then(({ data, info: { width, height } }) => ({ data, width, height }));
		input.pipe(transformer);

		return result;
	}
}
