import type { TFunction } from 'i18next';
import { Component } from 'preact';
import { Trans, withTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { ButtonGroup } from '../../components/ButtonGroup';
import MarkdownBlock from '../../components/MarkdownBlock';
import Screen from '../../components/Screen';
import { createClassName } from '../../helpers/createClassName';
import styles from './styles.scss';

type GDPRProps = {
	title: string;
	consentText: string;
	instructions: string;
	onAgree: () => void;
	t: TFunction;
};

class GDPR extends Component<GDPRProps> {
	handleClick = () => {
		const { onAgree } = this.props;
		onAgree?.();
	};

	render = ({ title, consentText, instructions, t }: GDPRProps) => (
		<Screen title={title} className={createClassName(styles, 'gdpr')}>
			<Screen.Content>
				{consentText ? (
					<p className={createClassName(styles, 'gdpr__consent-text')}>
						<MarkdownBlock text={consentText} />
					</p>
				) : (
					<p className={createClassName(styles, 'gdpr__consent-text')}>
						<Trans i18nKey='the_controller_of_your_personal_data_is_company_na' />
					</p>
				)}
				{instructions ? (
					<p className={createClassName(styles, 'gdpr__instructions')}>
						<MarkdownBlock text={instructions} />
					</p>
				) : (
					<p className={createClassName(styles, 'gdpr__instructions')}>
						<Trans i18nKey='go_to_menu_options_forget_remove_my_personal_data'>
							Go to <strong>menu options → Forget/Remove my personal data</strong> to request the immediate removal of your data.
						</Trans>
					</p>
				)}
				<ButtonGroup>
					<Button onClick={this.handleClick} stack>
						{t('i_agree')}
					</Button>
				</ButtonGroup>
			</Screen.Content>
			<Screen.Footer />
		</Screen>
	);
}

export default withTranslation()(GDPR);
