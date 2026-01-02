import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type FileUploadValue = {
	name: string;
	size: number;
	type: string;
	contentBase64: string;
};

export type FileUploadElement = Actionable<{
	type: 'file_upload';
	text?: PlainText;
	accept?: string;
	multiple?: boolean;
}>;
