import { Badge } from '@rocket.chat/fuselage';
import React from 'react';

const getBadgeVariant = (unread: boolean, mention: boolean, all: boolean) => {
	if (!unread) {
		return false;
	}

	if (mention) {
		return 'danger';
	}

	if (all) {
		return 'warning';
	}

	return 'primary';
};

const ThreadMetricsUnreadBadge = ({ unread, mention, all }: { unread: boolean; mention: boolean; all: boolean }) => {
	const variant = getBadgeVariant(unread, mention, all);

	if (!variant) return null;

	return <Badge small variant={variant} />;
};

export default ThreadMetricsUnreadBadge;
