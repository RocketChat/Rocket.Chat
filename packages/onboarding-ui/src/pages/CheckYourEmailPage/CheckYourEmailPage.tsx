import { HeroLayout, HeroLayoutTitle, HeroLayoutSubtitle } from '@rocket.chat/layout';
import type { ReactNode } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import EmailCodeFallback from '../../common/EmailCodeFallback';

export type CheckYourEmailPageProps = {
	title?: string;
	children?: ReactNode;
	onResendEmailRequest: () => void;
	onChangeEmailRequest: () => void;
};

const defaultSubtitleComponent = (
	<Trans i18nKey='page.checkYourEmail.subtitle'>
		Your request has been sent successfully.
		<br />
		Check your email inbox to launch your Enterprise trial.
	</Trans>
);

const CheckYourEmailPage = ({ title, children, onResendEmailRequest, onChangeEmailRequest }: CheckYourEmailPageProps) => {
	const { t } = useTranslation();

	return (
		<HeroLayout>
			<HeroLayoutTitle>{title || t('page.checkYourEmail.title')}</HeroLayoutTitle>
			<HeroLayoutSubtitle>{children || defaultSubtitleComponent}</HeroLayoutSubtitle>

			<EmailCodeFallback onResendEmailRequest={onResendEmailRequest} onChangeEmailRequest={onChangeEmailRequest} />
		</HeroLayout>
	);
};

export default CheckYourEmailPage;
