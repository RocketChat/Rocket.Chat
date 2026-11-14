import type { Actionable } from '../Actionable.js';

/** Lets the user attach files; the value is the list of the uploaded file IDs. */
export type FileInputElement = Actionable<{
	type: 'file_input';
	/** Accepted extensions, without the dot (`pdf`, `png`). Any file is accepted when omitted. */
	filetypes?: string[];
	/** Defaults to 10. */
	max_files?: number;
}>;
