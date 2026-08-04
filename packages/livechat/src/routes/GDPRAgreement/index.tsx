import { route } from 'preact-router';
import { Trans, useTranslation } from 'react-i18next';

import styles from './styles.scss';
import { Button } from '../../components/Button';
import { ButtonGroup } from '../../components/ButtonGroup';
import MarkdownBlock from '../../components/MarkdownBlock';
import { Screen, ScreenContent, ScreenFooter } from '../../components/Screen';
import { createClassName } from '../../helpers/createClassName';
import { useStore } from '../../store';

export type GDPRAgreementProps = {
	path?: string;
};

const GDPRAgreement = (_: GDPRAgreementProps) => {
	const { t } = useTranslation();
	const { config: { messages: { dataProcessingConsentText: consentText = '' } = {} } = {}, dispatch } = useStore();

	const handleAgreeClick = async () => {
		dispatch({ gdpr: { accepted: true } });
		route('/');
	};

	return (
		<Screen title={t('gdpr')} className={createClassName(styles, 'gdpr')}>
			<ScreenContent>
				{consentText ? (
					<p className={createClassName(styles, 'gdpr__consent-text')}>
						<MarkdownBlock text={consentText} />
					</p>
				) : (
					<p className={createClassName(styles, 'gdpr__consent-text')}>
						<Trans i18nKey='the_controller_of_your_personal_data_is_company_na' />
					</p>
				)}
				<p className={createClassName(styles, 'gdpr__instructions')}>
					<Trans i18nKey='go_to_menu_options_forget_remove_my_personal_data'>
						Go to <strong>menu options → Forget/Remove my personal data</strong> to request the immediate removal of your data.
					</Trans>
				</p>
				<ButtonGroup>
					<Button onClick={handleAgreeClick} stack>
						{t('i_agree')}
					</Button>
				</ButtonGroup>
			</ScreenContent>
			<ScreenFooter />
		</Screen>
	);
};

export default GDPRAgreement;
