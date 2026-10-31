import type { IScheduledMessage } from '@rocket.chat/core-typings';

import type { Upload } from '../../lib/chats/Upload';

export const toScheduledFiles = (uploads: readonly Upload[]): NonNullable<IScheduledMessage['files']> =>
	uploads
		.filter(({ url, error }) => url && !error)
		.map(({ id, file, altText }) => ({ _id: id, name: file.name, ...(altText && { description: altText }) }));
