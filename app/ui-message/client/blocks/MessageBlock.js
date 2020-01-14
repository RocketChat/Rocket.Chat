import React, { useRef, useEffect } from 'react';
import { UiKitMessage as uiKitMessage, kitContext, UiKitModal as uiKitModal, messageParser, modalParser } from '@rocket.chat/fuselage-ui-kit';
import { uiKitText } from '@rocket.chat/ui-kit';
import { Modal, AnimatedVisibility, ButtonGroup, Button } from '@rocket.chat/fuselage';

import { renderMessageBody } from '../../../ui-utils/client';
import { useReactiveValue } from '../../../../client/hooks/useReactiveValue';

messageParser.text = ({ text, type } = {}) => {
	if (type !== 'mrkdwn') {
		return text;
	}

	return <span dangerouslySetInnerHTML={{ __html: renderMessageBody({ msg: text }) }} />;
};

modalParser.text = messageParser.text;

const contextDefault = {
	action: console.log,
	state: (data) => {
		console.log('state', data);
	},
};
export const messageBlockWithContext = (context) => (props) => {
	const data = useReactiveValue(props.data);
	return (
		<kitContext.Provider value={context}>
			{uiKitMessage(data.blocks)}
		</kitContext.Provider>
	);
};

const textParser = uiKitText(new class {
	plain_text({ text }) {
		return text;
	}

	text({ text }) {
		return text;
	}
}());
const thumb =	'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
export const modalBlockWithContext = ({
	view: {
		title,
		close,
		submit,
	},
	onSubmit,
	onClose,
	...context
}) => (props) => {
	const { view } = useReactiveValue(props.data);
	const ref = useRef();
	useEffect(() => ref.current && ref.current.querySelector('input').focus(), []);
	return (
		<kitContext.Provider value={context}>
			<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
				<Modal open ref={ref}>
					<Modal.Header>
						{/* <Modal.Thumb url={`api/apps/${ context.appId }/icon`} /> */}
						<Modal.Thumb url={thumb} />
						<Modal.Title>{textParser([title])}</Modal.Title>
						<Modal.Close onClick={onClose} />
					</Modal.Header>
					<Modal.Content>{uiKitModal(view.blocks)}</Modal.Content>
					<Modal.Footer>
						<ButtonGroup align='end'>
							<Button onClick={onClose}>{textParser([close.text])}</Button>
							<Button primary onClick={onSubmit}>
								{textParser([submit.text])}
							</Button>
						</ButtonGroup>
					</Modal.Footer>
				</Modal>
			</AnimatedVisibility>
		</kitContext.Provider>
	);
};

export const MessageBlock = ({ blocks }, context = contextDefault) => (
	<kitContext.Provider value={context}>
		{uiKitMessage(blocks)}
	</kitContext.Provider>
);
