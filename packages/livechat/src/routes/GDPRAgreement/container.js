import { Component } from 'preact';
import { route } from 'preact-router';
import { withTranslation } from 'react-i18next';

import { Consumer } from '../../store';
import GDPRAgreement from './component';


class GDPRContainer extends Component {
	handleAgree = async () => {
		const { dispatch } = this.props;
		await dispatch({ gdpr: { accepted: true } });
		route('/');
	}

	render = (props) => (
		<GDPRAgreement {...props} onAgree={this.handleAgree} />
	)
}

const GDPRConnector = ({ ref, t, ...props }) => (
	<Consumer>
		{({
			config: {
				theme: {
					color,
				} = {},
				messages: {
					dataProcessingConsentText: consentText,
				} = {},
			} = {},
			iframe: {
				theme: {
					color: customColor,
					fontColor: customFontColor,
					iconColor: customIconColor,
				} = {},
			} = {},
			dispatch,
		}) => (
			<GDPRContainer
				ref={ref}
				{...props}
				theme={{
					color: customColor || color,
					fontColor: customFontColor,
					iconColor: customIconColor,
				}}
				title={t('gdpr')}
				dispatch={dispatch}
				consentText={consentText}
			/>
		)}
	</Consumer>
);


export default withTranslation()(GDPRConnector);
