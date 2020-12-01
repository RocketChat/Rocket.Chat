import { useCallback } from 'react';
import PropTypes from 'prop-types';

import { useTranslation } from '../contexts/TranslationContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export default function useClipboard(text) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const onClick = useCallback((e) => {
		e.preventDefault();
		try {
			navigator.clipboard.writeText(text);
			dispatchToastMessage({ type: 'success', message: t('Copied') });
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	}, [dispatchToastMessage, t, text]);

	return onClick;
}

useClipboard.propTypes = {
	text: PropTypes.string.isRequired,
};
