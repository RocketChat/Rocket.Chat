import { Component, createRef } from 'preact';
import { withTranslation } from 'react-i18next';

import Screen from '../../components/Screen';
import { createClassName } from '../../components/helpers';
import { parentCall } from '../../lib/parentCall';
import styles from './styles.scss';


class TriggerMessage extends Component {
	state = { };

	constructor(props) {
		super(props);
		this.ref = createRef();
	}

	componentDidUpdate() {
		let height = 0;

		for (const el of this.ref.current.base.children) {
			height += el.scrollHeight;
		}

		parentCall('resizeWidget', height);
	}

	render({ title, messages, loading, onStartChat = () => {}, departments, t, ...props }) {
		const defaultTitle = t('messages');
		const { theme: { color } } = props;
		return (
			<Screen
				title={title || defaultTitle}
				{...props}
				triggered={true}
				ref={this.ref}
			>
				<Screen.Content triggered={true}>
					{messages && messages.map((message) => message.msg && <p className={createClassName(styles, 'trigger-message__message')}>{message.msg}</p>)}
				</Screen.Content>
				<footer className={createClassName(styles, 'trigger-message__footer')}>
					<hr className={createClassName(styles, 'trigger-message__separator')} />
					<button style={color && { color }} onClick={onStartChat} className={createClassName(styles, 'trigger-message__link-reply')}>{t('start_chat')}</button>
				</footer>
			</Screen>
		);
	}
}

export default withTranslation()(TriggerMessage);
