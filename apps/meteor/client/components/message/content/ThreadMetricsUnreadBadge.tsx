import { Badge } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';

const getBadgeVariantAndTitle = (
	unread: boolean,
	mention: boolean,
	all: boolean,
): false | [ComponentProps<typeof Badge>['variant'], TranslationKey] => {
	if (!unread) {
		return false;
	}

	if (mention) {
		return ['danger', 'Mentions_you'];
	}

	if (all) {
		return ['warning', 'mention-all'];
	}

	return ['primary', 'Unread'];
};

const ThreadMetricsUnreadBadge = ({ unread, mention, all }: { unread: boolean; mention: boolean; all: boolean }) => {
	const t = useTranslation();
	const result = getBadgeVariantAndTitle(unread, mention, all);

	if (!result) return null;

	const [variant, title] = result;

	return <Badge small variant={variant} role='status' title={t(title)} />;
};

export default ThreadMetricsUnreadBadge;
