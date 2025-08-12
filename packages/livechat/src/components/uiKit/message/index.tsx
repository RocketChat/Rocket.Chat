import { uiKitMessage, UiKitParserMessage, BlockContext } from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';
import { Suspense } from 'preact/compat';

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

class MessageParser extends UiKitParserMessage<ComponentChild> {
	divider = (element: any, context: any, index: any) => {
		if (context !== BlockContext.BLOCK) {
			return null;
		}

		return <DividerBlock key={index} {...element} />;
	};

	section = (element: any, context: any, index: any) => {
		if (context !== BlockContext.BLOCK) {
			return null;
		}

		return <SectionBlock key={index} {...element} parser={this} />;
	};

	image = (element: any, context: any, index: any) => {
		if (context === BlockContext.BLOCK) {
			return <ImageBlock key={index} {...element} parser={this} />;
		}

		return <ImageElement key={index} {...element} parser={this} context={context} />;
	};

	actions = (element: any, context: any, index: any) => {
		if (context !== BlockContext.BLOCK) {
			return null;
		}

		return <ActionsBlock key={index} {...element} parser={this} />;
	};

	context = (element: any, context: any, index: any) => {
		if (context !== BlockContext.BLOCK) {
			return null;
		}

		return <ContextBlock key={index} {...element} parser={this} />;
	};

	plain_text = (element: any, context: any, index: any) => {
		if (context === BlockContext.BLOCK) {
			return null;
		}

		return (
			<Suspense fallback={null}>
				<PlainText key={index} {...element} />
			</Suspense>
		);
	};

	mrkdwn = (element: any, context: any, index: any) => {
		if (context === BlockContext.BLOCK) {
			return null;
		}

		return (
			<Suspense fallback={null}>
				<Mrkdwn key={index} {...element} />
			</Suspense>
		);
	};

	button = (element: any, context: any, index: any) => {
		if (context === BlockContext.BLOCK) {
			return null;
		}

		return <ButtonElement key={index} {...element} parser={this} context={context} />;
	};

	overflow = (element: any, context: any, index: any) => {
		if (context === BlockContext.BLOCK) {
			return null;
		}

		return <OverflowElement key={index} {...element} parser={this} context={context} />;
	};

	datePicker = (element: any, context: any, index: any) => {
		if (context === BlockContext.BLOCK) {
			return null;
		}

		return <DatePickerElement key={index} {...element} parser={this} context={context} />;
	};

	staticSelect = (element: any, context: any, index: any) => {
		if (context === BlockContext.BLOCK) {
			return null;
		}

		return <StaticSelectElement key={index} {...element} parser={this} context={context} />;
	};

	multiStaticSelect = () => null;
}

export const parser = new MessageParser();

export const renderMessageBlocks = uiKitMessage(parser, {
	engine: 'livechat',
}) as { (blocks: any): ComponentChild[] };
