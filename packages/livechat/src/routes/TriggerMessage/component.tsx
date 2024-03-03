import type { TFunction } from 'i18next';
import type { RefObject } from 'preact';
import { Component, createRef } from 'preact';
import { withTranslation } from 'react-i18next';

import Screen from '../../components/Screen';
import type { ScreenContextValue } from '../../components/Screen/ScreenProvider';
import { createClassName } from '../../helpers/createClassName';
import { parentCall } from '../../lib/parentCall';
import type { StoreState } from '../../store';
import styles from './styles.scss';

type TriggerMessageProps = {
	title: string;
	messages: StoreState['messages'];
	onStartChat: () => void;
	t: TFunction;
	theme: ScreenContextValue['theme'];
};

class TriggerMessage extends Component<TriggerMessageProps> {
	state = {};

	ref: RefObject<any>;

	constructor(props: TriggerMessageProps) {
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

	render = ({ title, messages, onStartChat = () => undefined, t }: TriggerMessageProps) => {
		const defaultTitle = t('messages');
		const { theme: { color } = {} } = this.props;

		return (
			<Screen title={title || defaultTitle} triggered ref={this.ref}>
				<Screen.Content triggered={true}>
					{messages?.map((message) => message.msg && <p className={createClassName(styles, 'trigger-message__message')}>{message.msg}</p>)}
				</Screen.Content>
				<footer className={createClassName(styles, 'trigger-message__footer')}>
					<hr className={createClassName(styles, 'trigger-message__separator')} />
					<button style={color && { color }} onClick={onStartChat} className={createClassName(styles, 'trigger-message__link-reply')}>
						{t('start_chat')}
					</button>
				</footer>
			</Screen>
		);
	};
}

export default withTranslation()(TriggerMessage);
