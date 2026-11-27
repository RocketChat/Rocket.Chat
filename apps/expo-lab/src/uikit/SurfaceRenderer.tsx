import { Component, Fragment, useMemo, type ReactElement, type ReactNode } from 'react';
import { View } from 'react-native';
import * as UiKit from '@rocket.chat/ui-kit';

import { Unsupported } from './Unsupported';
import { UiKitContext, type UiKitAction } from './context';
import { ActionsBlock, ContextBlock } from './blocks/actionsContext';
import { ButtonElement, ImageElement } from './blocks/elements';
import { DividerBlock, HeaderBlock, MarkdownBlock, SectionBlock } from './blocks/layout';
import { ImageBlock } from './blocks/media';
import { AlertBlock, CalloutBlock } from './blocks/notices';
import { renderTextObject } from './text';

// A payload comes from an app: one block that throws while mounting must not take the message down
class BlockBoundary extends Component<{ type: string; children: ReactNode }, { failed: boolean }> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	render() {
		return this.state.failed ? <Unsupported type={`${this.props.type} (malformed)`} /> : this.props.children;
	}
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// The block methods follow the shape of FuselageSurfaceRenderer in fuselage-ui-kit/src/surfaces: one method per type, null outside the BLOCK context
export class NativeSurfaceRenderer extends UiKit.SurfaceRenderer<ReactElement> {
	public constructor() {
		super(UiKit.messageSurfaceLayoutBlockTypes);
	}

	override render(blocks: readonly UiKit.Block[], conditions?: UiKit.Conditions): ReactElement[] {
		if (!Array.isArray(blocks)) return [];

		return blocks.map((block, index) => {
			const candidate: unknown = block;
			if (!isObject(candidate) || typeof candidate.type !== 'string') return <Unsupported key={index} type='malformed block' />;

			const rendered = super.render([block], conditions);
			const outsideSurface = rendered.length === 0 && candidate.type !== 'conditional';

			return (
				<BlockBoundary key={index} type={candidate.type}>
					{outsideSurface ? <Unsupported type={candidate.type} /> : <Fragment>{rendered}</Fragment>}
				</BlockBoundary>
			);
		});
	}

	override renderActionsBlockElement(block: UiKit.BlockElement, index: number) {
		return isObject(block) ? this.orPlaceholder(block, super.renderActionsBlockElement(block, index)) : <Unsupported type='malformed element' />;
	}

	override renderContextBlockElement(block: UiKit.TextObject | UiKit.BlockElement, index: number) {
		return isObject(block) ? this.orPlaceholder(block, super.renderContextBlockElement(block, index)) : <Unsupported type='malformed element' />;
	}

	override renderSectionAccessoryBlockElement(block: UiKit.BlockElement, index: number) {
		return isObject(block) ? this.orPlaceholder(block, super.renderSectionAccessoryBlockElement(block, index)) : <Unsupported type='malformed element' />;
	}

	private orPlaceholder(element: unknown, rendered: ReactElement | null) {
		if (rendered) return rendered;
		return <Unsupported type={isObject(element) && typeof element.type === 'string' ? element.type : 'malformed element'} />;
	}

	plain_text(textObject: UiKit.PlainText, context: UiKit.BlockContext, index: number) {
		return renderTextObject(textObject, context, index);
	}

	mrkdwn(textObject: UiKit.Markdown, context: UiKit.BlockContext, index: number) {
		return renderTextObject(textObject, context, index);
	}

	section(block: UiKit.SectionBlock, context: UiKit.BlockContext, index: number) {
		return context === UiKit.BlockContext.BLOCK ? <SectionBlock key={index} block={block} renderer={this} /> : null;
	}

	header(block: UiKit.HeaderBlock, context: UiKit.BlockContext, index: number) {
		return context === UiKit.BlockContext.BLOCK ? <HeaderBlock key={index} block={block} renderer={this} /> : null;
	}

	divider(_block: UiKit.DividerBlock, context: UiKit.BlockContext, index: number) {
		return context === UiKit.BlockContext.BLOCK ? <DividerBlock key={index} /> : null;
	}

	markdown(block: UiKit.MarkdownBlock, context: UiKit.BlockContext, index: number) {
		return context === UiKit.BlockContext.BLOCK ? <MarkdownBlock key={index} block={block} renderer={this} /> : null;
	}

	actions(block: UiKit.ActionsBlock, context: UiKit.BlockContext, index: number) {
		return context === UiKit.BlockContext.BLOCK ? <ActionsBlock key={index} block={block} renderer={this} /> : null;
	}

	context(block: UiKit.ContextBlock, context: UiKit.BlockContext, index: number) {
		return context === UiKit.BlockContext.BLOCK ? <ContextBlock key={index} block={block} renderer={this} /> : null;
	}

	callout(block: UiKit.CalloutBlock, context: UiKit.BlockContext, index: number) {
		return context === UiKit.BlockContext.BLOCK ? <CalloutBlock key={index} block={block} renderer={this} /> : null;
	}

	alert(block: UiKit.AlertBlock, context: UiKit.BlockContext, index: number) {
		return context === UiKit.BlockContext.BLOCK ? <AlertBlock key={index} block={block} renderer={this} /> : null;
	}

	image(block: UiKit.ImageBlock | UiKit.ImageElement, context: UiKit.BlockContext, index: number) {
		if (context === UiKit.BlockContext.BLOCK) return <ImageBlock key={index} block={block as UiKit.ImageBlock} renderer={this} />;
		return <ImageElement key={index} block={block} context={context} />;
	}

	button(block: UiKit.ButtonElement, context: UiKit.BlockContext, index: number) {
		return context === UiKit.BlockContext.BLOCK ? null : <ButtonElement key={index} block={block} />;
	}
}

type UiKitMessageProps = { blocks: readonly UiKit.Block[]; onAction?: (action: UiKitAction) => void };

const noop = () => undefined;

// Counterpart of UiKitMessage.tsx in fuselage-ui-kit: the message surface, no network
export function UiKitMessage({ blocks, onAction = noop }: UiKitMessageProps) {
	const renderer = useMemo(() => new NativeSurfaceRenderer(), []);
	const value = useMemo(() => ({ surface: 'message' as const, onAction }), [onAction]);

	return (
		<UiKitContext.Provider value={value}>
			<View style={{ gap: 8, width: '100%' }}>{renderer.render(blocks)}</View>
		</UiKitContext.Provider>
	);
}
