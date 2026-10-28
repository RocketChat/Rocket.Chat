import { Throbber } from '@rocket.chat/fuselage';
import { HeroLayout, HeroLayoutTitle } from '@rocket.chat/layout';
import { useTranslation } from 'react-i18next';

const ConfirmationProcessPage = () => {
	const { t } = useTranslation();

	return (
		<HeroLayout>
			<HeroLayoutTitle>{t('page.confirmationProcess.title')}</HeroLayoutTitle>
			<Throbber size='x16' inheritColor={true} />
		</HeroLayout>
	);
};

export default ConfirmationProcessPage;
