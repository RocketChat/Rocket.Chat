import { css } from '@rocket.chat/css-in-js';
import { Button } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

const AccessibilityShortcut = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const currentRoutePath = router.getLocationPathname();

	const customButtonClass = css`
		position: absolute;
		top: 2px;
		left: 2px;
		z-index: 99;
		&:not(:focus) {
			width: 1px;
			height: 1px;
			padding: 0;
			overflow: hidden;
			clip: rect(1px, 1px, 1px, 1px);
			border: 0;
		}
	`;

	return (
		<Button className={customButtonClass} is='a' href={`${currentRoutePath}#main-content`} primary>
			{t('Skip_to_main_content')}
		</Button>
	);
};

export default AccessibilityShortcut;
