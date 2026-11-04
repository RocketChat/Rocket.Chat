import type { LayoutBlockish } from '../LayoutBlockish';

/** An uploaded file shown as a card with a link to download it. */
export type FileBlock = LayoutBlockish<{
	type: 'file';
	file_id: string;
	source?: 'local';
}>;
