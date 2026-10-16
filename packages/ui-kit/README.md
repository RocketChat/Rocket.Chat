# `@rocket.chat/ui-kit`

> Types, validators and rendering contracts for UiKit, the block language Rocket.Chat Apps use to build UI.

[![npm](https://img.shields.io/npm/v/@rocket.chat/ui-kit?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/ui-kit) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/ui-kit?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/ui-kit)

UiKit describes UI as plain JSON: a list of layout blocks (sections, actions, inputs, images, ...), each holding elements (buttons, selects, date pickers, ...) and text objects. Rocket.Chat Apps send these blocks to the client, which draws them on one of five surfaces: message, modal, banner, contextual bar and attachment.

This package is the shared contract between the parties:

- **Types** for every block, element, text object and view, so you can write blocks with type checking.
- **Runtime validators** for views and interaction payloads (`isModalView`, `isServerInteraction`, ...).
- **Renderer base classes**, one per surface, that walk a block list and call your rendering functions. Rocket.Chat's React renderer, [`fuselage-ui-kit`](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/fuselage-ui-kit), is built on them.

App authors usually get these types through [`@rocket.chat/apps-engine`](https://www.npmjs.com/package/@rocket.chat/apps-engine). Use this package directly when you build a renderer or handle UiKit payloads yourself.

## Installation

```sh
npm install @rocket.chat/ui-kit @rocket.chat/icons
```

`@rocket.chat/icons` is a peer dependency; the banner view uses its icon names. The package is compiled to ES2024 JavaScript with ES module syntax and ships TypeScript declarations. It depends on [`typia`](https://typia.io/) for its runtime validators.

## Usage

### Writing blocks

Blocks are plain objects. Each surface has a layout type that only accepts the blocks it can show, such as `MessageSurfaceLayout` and `ModalSurfaceLayout`.

```ts
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';

const appId = 'my-app-id';

const blocks: MessageSurfaceLayout = [
	{
		type: 'section',
		text: { type: 'mrkdwn', text: '*Deploy finished* for `web-frontend`' },
	},
	{ type: 'divider' },
	{
		type: 'actions',
		elements: [
			{
				type: 'button',
				appId,
				blockId: 'deploy',
				actionId: 'rollback',
				text: { type: 'plain_text', text: 'Roll back' },
				style: 'danger',
				confirm: {
					title: { type: 'plain_text', text: 'Roll back?' },
					text: { type: 'plain_text', text: 'This restores the previous release.' },
					confirm: { type: 'plain_text', text: 'Roll back' },
					deny: { type: 'plain_text', text: 'Cancel' },
					style: 'danger',
				},
			},
		],
	},
];
```

Interactive elements (buttons, selects, inputs, ...) carry `appId`, `blockId` and `actionId`, which identify them when the user interacts. Text objects are either `plain_text` or `mrkdwn`, and can carry an `i18n` key instead of literal text.

### Views

A view wraps blocks with what its surface needs, such as a title and submit button for a modal.

```ts
import { isModalView, type ModalView } from '@rocket.chat/ui-kit';

const view: ModalView = {
	id: 'feedback-modal',
	appId: 'my-app-id',
	title: { type: 'plain_text', text: 'Send feedback' },
	submit: {
		type: 'button',
		appId: 'my-app-id',
		blockId: 'feedback-modal',
		actionId: 'submit',
		text: { type: 'plain_text', text: 'Send' },
		style: 'primary',
	},
	blocks: [
		{
			type: 'input',
			blockId: 'message',
			label: { type: 'plain_text', text: 'Message' },
			element: {
				type: 'plain_text_input',
				appId: 'my-app-id',
				blockId: 'message',
				actionId: 'message',
				multiline: true,
			},
		},
	],
};

isModalView(view); // true
```

`isView`, `isModalView`, `isBannerView` and `isContextualBarView` check unknown input at runtime.

### Rendering blocks

Extend the parser for the surface you draw and add a method for each block, element and text object type you support. The method is named after the `type` and receives the block, a `BlockContext` and its index. Blocks without a method are skipped, and so are blocks the surface does not accept.

```ts
import { BlockContext, UiKitParserMessage, uiKitMessage } from '@rocket.chat/ui-kit';
import type { ButtonElement, Markdown, PlainText, SectionBlock } from '@rocket.chat/ui-kit';

class TextRenderer extends UiKitParserMessage<string> {
	plain_text({ text }: PlainText): string {
		return text;
	}

	mrkdwn({ text }: Markdown): string {
		return text;
	}

	section(block: SectionBlock, context: BlockContext, index: number): string | null {
		return block.text ? this.renderTextObject(block.text, index, BlockContext.SECTION) : null;
	}

	divider(): string {
		return '---';
	}

	button(element: ButtonElement): string {
		return `[${element.text.text}]`;
	}
}

const render = uiKitMessage(new TextRenderer());

render(blocks); // ['*Deploy finished* for `web-frontend`', '---']
```

`actions` is not handled above, so its button is not drawn. To draw the elements inside a layout block, call `renderActionsBlockElement`, `renderContextBlockElement`, `renderInputBlockElement` or `renderSectionAccessoryBlockElement` from your block method; they dispatch the element to its method with the matching `BlockContext`.

Each surface has the same trio: a parser class, a render function and the list of accepted block types.

| Surface        | Parser                     | Render function      | Accepted blocks                        |
| -------------- | -------------------------- | -------------------- | -------------------------------------- |
| Message        | `UiKitParserMessage`       | `uiKitMessage`       | `messageSurfaceLayoutBlockTypes`       |
| Modal          | `UiKitParserModal`         | `uiKitModal`         | `modalSurfaceLayoutBlockTypes`         |
| Banner         | `UiKitParserBanner`        | `uiKitBanner`        | `bannerSurfaceLayoutBlockTypes`        |
| Contextual bar | `UiKitParserContextualBar` | `uiKitContextualBar` | `contextualBarSurfaceLayoutBlockTypes` |
| Attachment     | `UiKitParserAttachment`    | `uiKitAttachment`    | `attachmentSurfaceLayoutBlockTypes`    |

### Conditional blocks

A `conditional` block shows its `render` blocks only on the engines listed in `when`. Pass the current engine as the second argument of a render function; without it, every conditional block is shown.

```ts
import type { ConditionalBlock } from '@rocket.chat/ui-kit';

const livechatOnly: ConditionalBlock = {
	type: 'conditional',
	when: { engine: ['livechat'] },
	render: [{ type: 'section', text: { type: 'plain_text', text: 'Only in Livechat' } }],
};

uiKitMessage(new TextRenderer(), { engine: 'livechat' })([livechatOnly]); // ['Only in Livechat']
uiKitMessage(new TextRenderer(), { engine: 'rocket.chat' })([livechatOnly]); // []
```

### Interactions

`UserInteraction` types what the client sends to an App (`blockAction`, `viewSubmit`, `viewClosed`, action buttons). `ServerInteraction` types what the App answers with (`modal.open`, `banner.update`, `contextual_bar.close`, `errors`, ...). Each variant has a validator:

```ts
import { isOpenModalServerInteraction, isServerInteraction } from '@rocket.chat/ui-kit';

if (isServerInteraction(payload) && isOpenModalServerInteraction(payload)) {
	openModal(payload.view);
}
```

### Opening links safely

`isSafeUrl(url)` returns `false` for `javascript:`, `data:` and `vbscript:` URLs and for strings that are not URLs. Use it before opening a URL an App attached to a button or menu option.

### Further reading

The [UiKit feature notes](https://github.com/RocketChat/Rocket.Chat/tree/develop/docs/features/uikit) in the repository go deeper:

- [reference.md](https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/features/uikit/reference.md): every block, element and text object, with its fields
- [support-matrix.md](https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/features/uikit/support-matrix.md): which surface accepts which block, and which renderer draws it
- [rendering.md](https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/features/uikit/rendering.md), [surfaces.md](https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/features/uikit/surfaces.md), [text-objects.md](https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/features/uikit/text-objects.md) and [interactions.md](https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/features/uikit/interactions.md)

## API

### Types

| Group                | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout blocks        | `LayoutBlock`, `ActionsBlock`, `CalloutBlock`, `ConditionalBlock`, `ContextBlock`, `DividerBlock`, `ImageBlock`, `InfoCardBlock`, `InputBlock`, `PreviewBlock`, `SectionBlock`, `VideoConferenceBlock`, `ExperimentalTabNavigationBlock`                                                                                                                                                                                                                                                                              |
| Elements             | `BlockElement`, `ButtonElement`, `CheckboxElement`, `ChannelsSelectElement`, `ConversationsSelectElement`, `DatePickerElement`, `IconElement`, `IconButtonElement`, `ImageElement`, `LinearScaleElement`, `MultiChannelsSelectElement`, `MultiConversationsSelectElement`, `MultiStaticSelectElement`, `MultiUsersSelectElement`, `OverflowElement`, `PlainTextInputElement`, `RadioButtonElement`, `StaticSelectElement`, `TimePickerElement`, `ToggleSwitchElement`, `UsersSelectElement`, `ExperimentalTabElement` |
| Text and composition | `TextObject`, `PlainText`, `Markdown`, `Option`, `OptionGroup`, `ConfirmationDialog`, `InputElementDispatchAction`                                                                                                                                                                                                                                                                                                                                                                                                    |
| Views                | `View`, `ModalView`, `BannerView`, `ContextualBarView`                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Surface layouts      | `MessageSurfaceLayout`, `ModalSurfaceLayout`, `BannerSurfaceLayout`, `ContextualBarSurfaceLayout`, `AttachmentSurfaceLayout`                                                                                                                                                                                                                                                                                                                                                                                          |
| Rendering            | `BlockRenderers`, `Conditions`, `ActionableElement`, `ActionOf`, `RenderableBlock`, `RenderableLayoutBlock`, `Block`                                                                                                                                                                                                                                                                                                                                                                                                  |
| Interactions         | `UserInteraction`, `ServerInteraction` and their variants (`ViewSubmitUserInteraction`, `MessageBlockActionUserInteraction`, ...)                                                                                                                                                                                                                                                                                                                                                                                     |

`ExperimentalTabNavigationBlock` and `ExperimentalTabElement` are experimental and may change.

### Values

| Export                                                                              | Description                                                                                             |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `LayoutBlockType`, `BlockElementType`, `TextObjectType`                             | Constants for the `type` strings, e.g. `LayoutBlockType.SECTION === 'section'`                          |
| `BlockContext`                                                                      | Where an element is being rendered: `NONE`, `BLOCK`, `SECTION`, `ACTION`, `FORM`, `CONTEXT`             |
| `SurfaceRenderer`                                                                   | Base class of every surface parser; takes the list of accepted layout block types                       |
| `UiKitParser*`, `uiKit*`, `*SurfaceLayoutBlockTypes`                                | Per-surface parser, render function and accepted block list (see [Rendering blocks](#rendering-blocks)) |
| `isView`, `isModalView`, `isBannerView`, `isContextualBarView`                      | Runtime validators for views                                                                            |
| `isServerInteraction`, `is<Variant>ServerInteraction`, `is<Variant>UserInteraction` | Runtime validators for interaction payloads                                                             |
| `isPreviewBlockWithThumb`, `isPreviewBlockWithPreview`                              | Narrow a `PreviewBlock`                                                                                 |
| `isSafeUrl(url)`                                                                    | `false` for URLs that would run code when opened                                                        |

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/ui-kit). From the repository root:

```sh
yarn workspace @rocket.chat/ui-kit build
yarn workspace @rocket.chat/ui-kit testunit
yarn workspace @rocket.chat/ui-kit lint
yarn workspace @rocket.chat/ui-kit typecheck
```

The build patches TypeScript with `ts-patch` and `typia` so that the `typia.createIs<T>()` calls are turned into validators at compile time.

When you add or change a block, follow [adding-a-block.md](https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/features/uikit/adding-a-block.md): a block has to be wired in this package, in the renderers and in the Apps-Engine.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
