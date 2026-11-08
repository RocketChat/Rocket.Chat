import { isRecord } from '@rocket.chat/tools';

/** Drops the markdown trees from sent attachments, so the only trees a message carries are the ones the server built. */
export const removeAttachmentMarkdown = (attachments: unknown): unknown => {
	if (!Array.isArray(attachments)) {
		return attachments;
	}

	const cleaned: unknown[] = [];
	const pending = [{ source: attachments as unknown[], target: cleaned }];

	for (let next = pending.pop(); next; next = pending.pop()) {
		for (const attachment of next.source) {
			if (!isRecord(attachment)) {
				next.target.push(attachment);
				continue;
			}

			const { md, descriptionMd, ...rest } = attachment;

			if (Array.isArray(rest.attachments)) {
				const nested: unknown[] = [];
				pending.push({ source: rest.attachments, target: nested });
				rest.attachments = nested;
			}

			next.target.push(rest);
		}
	}

	return cleaned;
};
