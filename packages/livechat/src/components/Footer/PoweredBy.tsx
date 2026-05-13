import { RocketChatLogo } from '@rocket.chat/logo';
import { useTranslation } from 'react-i18next';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

type PoweredByProps = {
	className?: string;
};

export const PoweredBy = ({ className, ...props }: PoweredByProps) => {
	const { t } = useTranslation();

	return (
		<h3 data-qa='livechat-watermark' className={createClassName(styles, 'powered-by', {}, [className])} {...props}>
			{t('powered_by_rocket_chat').split('Rocket.Chat')[0]}
			<a className={createClassName(styles, 'powered-by__logo')} href='https://rocket.chat' target='_blank' rel='noopener noreferrer'>
				<RocketChatLogo />
			</a>
			{t('powered_by_rocket_chat').split('Rocket.Chat')[1]}
		</h3>
	);
};

export default PoweredBy;
