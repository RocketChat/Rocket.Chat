import { uiKitMessage, UiKitParserMessage, BlockContext } from '@rocket.chat/ui-kit';
import type {
	DividerBlock as DividerBlockType,
	SectionBlock as SectionBlockType,
	ImageBlock as ImageBlockType,
	ImageElement as ImageElementType,
	ActionsBlock as ActionsBlockType,
	ContextBlock as ContextBlockType,
	PlainText as PlainTextObject,
	Markdown as MarkdownObject,
	ButtonElement as ButtonElementType,
	OverflowElement as OverflowElementType,
	DatePickerElement as DatePickerElementType,
	StaticSelectElement as StaticSelectElementType,
	MultiStaticSelectElement as MultiStaticSelectElementType,
} from '@rocket.chat/ui-kit';
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
	divider = (element: DividerBlockType, context: BlockContext, index: number): ComponentChild | null => {
		if (context !== BlockContext.BLOCK) {
			return null;
		}

		return <DividerBlock key={index} {...element} />;
	};

	section = (element: SectionBlockType, context: BlockContext, index: number): ComponentChild | null => {
		if (context !== BlockContext.BLOCK) {
			return null;
		}

		return <SectionBlock key={index} {...element} parser={this} />;
	};

	image = (element: ImageBlockType | ImageElementType, context: BlockContext, index: number): ComponentChild | null => {
		if (context === BlockContext.BLOCK) {
			return <ImageBlock key={index} {...(element as ImageBlockType)} parser={this} />;
		}

		return <ImageElement key={index} {...(element as ImageElementType)} context={context} />;
	};

	actions = (element: ActionsBlockType, context: BlockContext, index: number): ComponentChild | null => {
		if (context !== BlockContext.BLOCK) {
			return null;
		}

		return <ActionsBlock key={index} {...element} parser={this} />;
	};

	context = (element: ContextBlockType, context: BlockContext, index: number): ComponentChild | null => {
		if (context !== BlockContext.BLOCK) {
			return null;
		}

		return <ContextBlock key={index} {...element} parser={this} />;
	};

	plain_text = (element: PlainTextObject, context: BlockContext, index: number): ComponentChild | null => {
		if (context === BlockContext.BLOCK) {
			return null;
		}

		return (
			<Suspense fallback={null}>
				<PlainText key={index} {...element} />
			</Suspense>
		);
	};

	mrkdwn = (element: MarkdownObject, context: BlockContext, index: number): ComponentChild | null => {
		if (context === BlockContext.BLOCK) {
			return null;
		}

		return (
			<Suspense fallback={null}>
				<Mrkdwn key={index} {...element} />
			</Suspense>
		);
	};

	button = (element: ButtonElementType, context: BlockContext, index: number): ComponentChild | null => {
		if (context === BlockContext.BLOCK) {
			return null;
		}

		return <ButtonElement key={index} {...element} parser={this} context={context} />;
	};

	overflow = (element: OverflowElementType, context: BlockContext, index: number): ComponentChild | null => {
		if (context === BlockContext.BLOCK) {
			return null;
		}

		return <OverflowElement key={index} {...element} parser={this} />;
	};

	datePicker = (element: DatePickerElementType, context: BlockContext, index: number): ComponentChild | null => {
		if (context === BlockContext.BLOCK) {
			return null;
		}

		return <DatePickerElement key={index} {...element} />;
	};

	staticSelect = (element: StaticSelectElementType, context: BlockContext, index: number): ComponentChild | null => {
		if (context === BlockContext.BLOCK) {
			return null;
		}

		return <StaticSelectElement key={index} {...element} parser={this} />;
	};

	multiStaticSelect = (_element: MultiStaticSelectElementType, _context: BlockContext, _index: number): ComponentChild | null => null;
}

export const parser = new MessageParser();

export const renderMessageBlocks = uiKitMessage(parser, {
	engine: 'livechat',
}) as (blocks: readonly unknown[]) => ComponentChild[];
