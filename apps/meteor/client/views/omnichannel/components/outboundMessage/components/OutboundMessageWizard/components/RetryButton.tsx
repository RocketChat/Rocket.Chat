import { css } from '@rocket.chat/css-in-js';
import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type RetryButtonProps = {
	loading: boolean;
	onClick(): void;
};

/* NOTE: Necessary hack due to Field styles interfering with icons */
const btnStyle = css`
	i {
		font-family: 'RocketChat';
		font-style: normal;
	}
`;

const RetryButton = ({ loading, onClick }: RetryButtonProps) => {
	const { t } = useTranslation();

	return (
		<IconButton
			mini
			danger
			secondary
			className={btnStyle}
			disabled={loading}
			rcx-button--loading={loading}
			icon={loading ? 'loading' : 'reload'}
			title={loading ? t('Loading...') : t('Retry')}
			mis={4}
			onClick={() => onClick()}
		/>
	);
};

export default RetryButton;
