import { UiKitParserAttachment, attachmentSurfaceLayoutBlockTypes } from './attachment/UiKitParserAttachment.js';
import { UiKitParserBanner, bannerSurfaceLayoutBlockTypes } from './banner/UiKitParserBanner.js';
import { UiKitParserContextualBar, contextualBarSurfaceLayoutBlockTypes } from './contextualBar/UiKitParserContextualBar.js';
import { UiKitParserMessage, messageSurfaceLayoutBlockTypes } from './message/UiKitParserMessage.js';
import { UiKitParserModal, modalSurfaceLayoutBlockTypes } from './modal/UiKitParserModal.js';
import type { Block } from '../blocks/Block.js';
import { LayoutBlockType } from '../blocks/LayoutBlockType.js';
import type { SurfaceRenderer } from '../rendering/SurfaceRenderer.js';

type ParserClass = abstract new () => SurfaceRenderer<unknown, any>;

const renderableTypes = Object.values(LayoutBlockType).filter((type) => type !== LayoutBlockType.CONDITIONAL);

// Draws every layout block as its type name, so the output lists the blocks the surface let through.
const renderAllBlockTypes = (Parser: ParserClass) => {
	class TestParser extends Parser {
		plain_text = () => null;

		mrkdwn = () => null;
	}

	const parser = new TestParser() as TestParser & Record<string, unknown>;
	for (const type of renderableTypes) {
		parser[type] = () => type;
	}

	return parser.render(renderableTypes.map((type) => ({ type }) as Block));
};

it.each([
	['message', UiKitParserMessage, messageSurfaceLayoutBlockTypes],
	['modal', UiKitParserModal, modalSurfaceLayoutBlockTypes],
	['banner', UiKitParserBanner, bannerSurfaceLayoutBlockTypes],
	['contextual bar', UiKitParserContextualBar, contextualBarSurfaceLayoutBlockTypes],
	['attachment', UiKitParserAttachment, attachmentSurfaceLayoutBlockTypes],
] as const)('the %s parser renders exactly the blocks its surface accepts', (_surface, Parser, allowedTypes) => {
	expect(renderAllBlockTypes(Parser).sort()).toEqual([...allowedTypes].sort());
});
