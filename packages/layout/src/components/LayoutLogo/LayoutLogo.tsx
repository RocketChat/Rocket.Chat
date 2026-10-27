import { Box } from '@rocket.chat/fuselage';
import { RocketChatLogo } from '@rocket.chat/logo';

import { useDarkMode } from '../../DarkModeProvider';
import { useLayoutContext } from '../../contexts/LayoutContext';

const LayoutLogo = () => {
	const { logo, logoDark = logo } = useLayoutContext();
	const isDark = useDarkMode();
	return (
		<Box width='100%' maxWidth={224}>
			{(isDark ? logoDark : logo) || <RocketChatLogo />}
		</Box>
	);
};

export default LayoutLogo;
