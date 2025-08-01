import type { MouseEvent, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

// TODO: Move this hook to fuselage-hooks
const useLinkPattern = ({ onPress }: { onPress: (e: MouseEvent<Element> | KeyboardEvent<Element>) => void }) => {
	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			onPress(event);
		}
	};

	return { onClick: onPress, onKeyDown: handleKeyDown, role: 'link', tabIndex: 0 };
};

export const useThreadMessageProps = (onClick: () => void, isOTRMsg: boolean, isSelected: boolean) => {
	const { t } = useTranslation();
	const linkProps = useLinkPattern({
		onPress: onClick,
	});

	return {
		'aria-roledescription': isOTRMsg ? t('OTR_thread_message_preview') : t('thread_message_preview'),
		isSelected,
		'data-qa-selected': isSelected,
		...linkProps,
	};
};
