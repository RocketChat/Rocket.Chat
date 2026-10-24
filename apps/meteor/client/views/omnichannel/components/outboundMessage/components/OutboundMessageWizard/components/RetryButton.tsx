import { css } from '@rocket.chat/css-in-js';
import { IconButton, useStyle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type RetryButtonProps = {
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
	const btnClassName = useStyle(btnStyle);

	return (
		<IconButton
			mini
			danger
			secondary
			className={[btnClassName, loading && 'rcx-button--loading'].filter(Boolean).join(' ')}
			disabled={loading}
			icon={loading ? 'loading' : 'reload'}
			title={loading ? t('Loading...') : t('Retry')}
			onClick={() => onClick()}
		/>
	);
};

export default RetryButton;
