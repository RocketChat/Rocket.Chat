import { uiKitMessage, UiKitParserMessage, BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import ActionsBlock from './ActionsBlock';
import ButtonElement from './ButtonElement';
import ContextBlock from './ContextBlock';
import DatePickerElement from './DatePickerElement';
import DividerBlock from './DividerBlock';
import ImageBlock from './ImageBlock';
import ImageElement from './ImageElement';
import Mrkdwn from './Mrkdwn';
import OverflowElement from './OverflowElement';
import PlainText from './PlainText';
import SectionBlock from './SectionBlock';
import StaticSelectElement from './StaticSelectElement';

class MessageParser extends UiKitParserMessage {
	divider = (element, context, index) => {
		if (context !== BLOCK_CONTEXT.BLOCK) {
			return null;
		}

		return <DividerBlock key={index} {...element} />;
	}

	section = (element, context, index) => {
		if (context !== BLOCK_CONTEXT.BLOCK) {
			return null;
		}

		return <SectionBlock key={index} {...element} parser={this} />;
	}

	image = (element, context, index) => {
		if (context === BLOCK_CONTEXT.BLOCK) {
			return <ImageBlock key={index} {...element} parser={this} />;
		}

		return <ImageElement key={index} {...element} parser={this} context={context} />;
	}

	actions = (element, context, index) => {
		if (context !== BLOCK_CONTEXT.BLOCK) {
			return null;
		}

		return <ActionsBlock key={index} {...element} parser={this} />;
	}

	context = (element, context, index) => {
		if (context !== BLOCK_CONTEXT.BLOCK) {
			return null;
		}

		return <ContextBlock key={index} {...element} parser={this} />;
	}

	plainText = (element, context, index) => {
		if (context === BLOCK_CONTEXT.BLOCK) {
			return null;
		}

		return <PlainText key={index} {...element} />;
	}

	mrkdwn = (element, context, index) => {
		if (context === BLOCK_CONTEXT.BLOCK) {
			return null;
		}

		return <Mrkdwn key={index} {...element} />;
	}

	button = (element, context, index) => {
		if (context === BLOCK_CONTEXT.BLOCK) {
			return null;
		}

		return <ButtonElement key={index} {...element} parser={this} context={context} />;
	}

	overflow = (element, context, index) => {
		if (context === BLOCK_CONTEXT.BLOCK) {
			return null;
		}

		return <OverflowElement key={index} {...element} parser={this} context={context} />;
	}

	datePicker = (element, context, index) => {
		if (context === BLOCK_CONTEXT.BLOCK) {
			return null;
		}

		return <DatePickerElement key={index} {...element} parser={this} context={context} />;
	}

	staticSelect = (element, context, index) => {
		if (context === BLOCK_CONTEXT.BLOCK) {
			return null;
		}

		return <StaticSelectElement key={index} {...element} parser={this} context={context} />;
	}

	multiStaticSelect = () =>
		null
}

export const parser = new MessageParser();

export const renderMessageBlocks = uiKitMessage(parser, {
	engine: 'livechat',
});
