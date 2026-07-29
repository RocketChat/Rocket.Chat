import { useAttachmentIsCollapsedByDefault } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

const MAX_CACHE_SIZE = 500;
const collapsedCache = new Map<string, boolean>();

const setCache = (id: string, value: boolean) => {
	if (collapsedCache.size >= MAX_CACHE_SIZE && !collapsedCache.has(id)) {
		const firstKey = collapsedCache.keys().next().value;
		if (firstKey !== undefined) {
			collapsedCache.delete(firstKey);
		}
	}
	collapsedCache.set(id, value);
};

export const useCollapse = (attachmentCollapsed?: boolean, id?: string) => {
	const collapseByDefault = useAttachmentIsCollapsedByDefault();
	const [collapsed, setCollapsed] = useState(() => {
		if (id && collapsedCache.has(id)) {
			return collapsedCache.get(id)!;
		}
		return Boolean(collapseByDefault || attachmentCollapsed);
	});

	useEffect(() => {
		if (id && collapsedCache.has(id)) {
			setCollapsed(collapsedCache.get(id)!);
		} else {
			setCollapsed(Boolean(collapseByDefault || attachmentCollapsed));
		}
	}, [id, collapseByDefault, attachmentCollapsed]);

	const toggleCollapsed = useCallback(() => {
		setCollapsed((prev) => {
			const next = !prev;
			if (id) {
				setCache(id, next);
			}
			return next;
		});
	}, [id]);

	return [collapsed, toggleCollapsed] as const;
};
