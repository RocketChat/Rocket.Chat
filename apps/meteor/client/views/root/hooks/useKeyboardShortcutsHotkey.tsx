import { useSetModal } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import tinykeys from 'tinykeys';

import KeyboardShortcutsModal from '../../../navbar/NavBarSettingsToolbar/UserMenu/KeyboardShortcutsModal';

const shouldIgnoreKeyStroke = (target: EventTarget | null): boolean => {
	if (!(target instanceof Element)) {
		return false;
	}

	if (target instanceof HTMLElement && target.isContentEditable) {
		return true;
	}

	const { tagName } = target;
	if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
		return true;
	}

	return target.closest('dialog[open]') !== null;
};

export const useKeyboardShortcutsHotkey = () => {
	const setModal = useSetModal();

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			if (shouldIgnoreKeyStroke(event.target)) {
				return;
			}

			event.preventDefault();

			const handleClose = () => setModal(null);
			setModal(<KeyboardShortcutsModal onClose={handleClose} />);
		};

		return tinykeys(window, {
			'Shift+?': handler,
		});
	}, [setModal]);
};
