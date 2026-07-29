import { useAttachmentIsCollapsedByDefault } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

const collapsedCache = new Map<string, boolean>();

export const useCollapse = (attachmentCollapsed?: boolean, id?: string) => {
	const collapseByDefault = useAttachmentIsCollapsedByDefault();
	const [collapsed, setCollapsed] = useState(() => {
		if (id && collapsedCache.has(id)) {
			return collapsedCache.get(id)!;
		}
		return Boolean(collapseByDefault || attachmentCollapsed);
	});

	const toggleCollapsed = useCallback(() => {
		setCollapsed((prev) => {
			const next = !prev;
			if (id) {
				collapsedCache.set(id, next);
			}
			return next;
		});
	}, [id]);

	return [collapsed, toggleCollapsed] as const;
};
