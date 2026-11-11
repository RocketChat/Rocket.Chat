import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type CallBarProps = {
	/** The call's own controls — mic, camera, screen, hang up. */
	centre?: ReactNode;
};

/**
 * The in-call control bar along the bottom of the conference, where third-party providers put their own toolbar.
 * Only the call's own controls live here; what is about the window — panel toggles, who is in, what is unread —
 * belongs to the top bar.
 */
const CallBar = ({ centre }: CallBarProps) => {
	const { t } = useTranslation();

	return (
		<Box
			is='footer'
			// Named, like the top bar: a footer is a landmark, and a modal in this window brings a second one.
			aria-label={t('Call_controls')}
			display='flex'
			alignItems='center'
			justifyContent='center'
			flexShrink={0}
			width='100%'
			minHeight={68}
			paddingInline={12}
		>
			{centre}
		</Box>
	);
};

export default CallBar;
