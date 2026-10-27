# `@rocket.chat/fuselage`

> React component library for Fuselage, Rocket.Chat's design system.

[![npm](https://img.shields.io/npm/v/@rocket.chat/fuselage?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/fuselage) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/fuselage?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/fuselage)

Fuselage is the set of React components that the Rocket.Chat web client is built with. It covers layout primitives, form inputs, buttons, menus, modals, messages, sidebars, tables and more, all styled with the Fuselage design tokens.

- `Box`, a polymorphic primitive that turns design tokens into styling props (`padding='x16'`, `backgroundColor='surface-light'`, `fontScale='h2'`).
- Accessible inputs, selects and menus, several of them built on [React Aria](https://react-spectrum.adobe.com/react-aria/).
- Light, dark and high-contrast themes through CSS custom properties.
- TypeScript types for every component and its props.

## Installation

```sh
npm install @rocket.chat/fuselage @rocket.chat/fuselage-hooks @rocket.chat/icons react react-dom react-virtuoso
```

`@rocket.chat/fuselage-hooks`, `@rocket.chat/icons`, `react`, `react-dom` and `react-virtuoso` are peer dependencies. The package is developed against React 19.

To write your own styles with `css`, as in the [Themes](#themes) example, also install `@rocket.chat/css-in-js`. Fuselage depends on it but does not re-export it, so strict package managers such as pnpm won't resolve a direct import otherwise:

```sh
npm install @rocket.chat/css-in-js
```

The package ships a CommonJS bundle (with development and production builds picked by `process.env.NODE_ENV`), TypeScript declarations, and a stylesheet. It is meant to be consumed through a bundler that can import CSS.

## Usage

### Load the styles

Import the component stylesheet and the icon font once, at the entry point of your app:

```ts
import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';
```

`fuselage.css` includes the Inter font, a normalize reset and the styles of every component.

### Render components

```tsx
import { Box, Button, ButtonGroup, Field, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { useState } from 'react';

export function ProfileForm({ onSave }: { onSave: (name: string) => void }) {
	const [name, setName] = useState('');

	return (
		<Box
			is='form'
			padding='x24'
			backgroundColor='surface-light'
			onSubmit={(e) => {
				e.preventDefault();
				onSave(name);
			}}
		>
			<Box is='h2' fontScale='h2' marginBlockEnd='x16' color='font-titles-labels'>
				Profile
			</Box>
			<Field>
				<FieldLabel htmlFor='profile-name'>Name</FieldLabel>
				<FieldRow>
					<TextInput id='profile-name' value={name} onChange={(e) => setName(e.currentTarget.value)} />
				</FieldRow>
			</Field>
			<ButtonGroup align='end'>
				<Button type='submit' variant='primary' icon='check'>
					Save
				</Button>
			</ButtonGroup>
		</Box>
	);
}
```

### Style with `Box`

`Box` renders a `div` by default; use `is` to render another element or component. Most CSS properties are available as props under their full camelCase name (`paddingInline`, `marginBlockEnd`, `backgroundColor`…), and they accept design tokens:

- Spacing and sizes: `x4`, `x8`, `x16`… (a pixel value converted to `rem`), `neg-x8` for negative values, `none`, and for sizes `full`. Plain numbers are pixels; other strings pass through as CSS.
- Colors: palette names such as `surface-light`, `font-default`, `stroke-light`, `status-background-info`.
- Typography: `fontScale` takes `hero`, `h1`–`h5`, `p1`, `p1m`, `p1b`, `p2`, `p2m`, `p2b`, `c1`, `c2` and `micro`.
- Border: `borderWidth` and `borderRadius` take token names such as `none`, `default`, `medium` and `large`; `borderRadius` also takes `small` and `full`.

```tsx
import { Box, Icon } from '@rocket.chat/fuselage';

<Box display='flex' alignItems='center' paddingInline='x16' paddingBlock='x8' borderRadius='medium' backgroundColor='surface-tint'>
	<Icon name='info' size='x20' color='font-info' />
	<Box marginInlineStart='x8' fontScale='p2' withTruncatedText>
		Messages are end-to-end encrypted.
	</Box>
</Box>;
```

Use `Stack` to space a group of children without wrapping each one:

```tsx
import { Button, Stack } from '@rocket.chat/fuselage';

<Stack direction='row' gap='x8'>
	<Button>Cancel</Button>
	<Button variant='primary'>Confirm</Button>
</Stack>;
```

### Themes

Render `PaletteStyleTag` once to set the color palette. It writes the palette as `--rcx-color-*` CSS custom properties on `:root`.

```tsx
import { PaletteStyleTag } from '@rocket.chat/fuselage';

<PaletteStyleTag theme='dark' />;
```

`theme` accepts `light` (default), `dark` and `high-contrast`. Use `selector` to scope the palette to part of the page, or `palette` to pass your own CSS.

To read palette values in your own styles, use `Palette`. Each entry stringifies to a `var(--rcx-color-…)` reference with a fallback value. This example uses `@rocket.chat/css-in-js`, which you install separately (see [Installation](#installation)):

```ts
import { css } from '@rocket.chat/css-in-js';
import { Palette } from '@rocket.chat/fuselage';

const banner = css`
	color: ${Palette.text['font-default']};
	background-color: ${Palette.surface['surface-tint']};
`;
```

## API

Every component is a named export, with a matching `<Name>Props` type. The main groups are:

| Category              | Components                                                                                                                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout                | `Box`, `StylingBox`, `Margins`, `FlexContainer`, `FlexItem`, `Grid`, `GridItem`, `Scrollable`, `Divider`, `Card` (+ `CardBody`, `CardHeader`, `CardTitle`, `CardRow`, `CardCol`, `CardControls`), `CardGrid`, `CardGroup`, `Tile` |
| Buttons               | `Button`, `IconButton`, `ButtonGroup`, `SplitButton`, `SplitButtonTrigger`, `Chip`                                                                                                                                                |
| Forms                 | `Field` (+ `FieldLabel`, `FieldLabelInfo`, `FieldRow`, `FieldDescription`, `FieldHint`, `FieldError`, `FieldLink`), `FieldGroup`, `Label`                                                                                         |
| Inputs                | `TextInput`, `TextAreaInput`, `EmailInput`, `PasswordInput`, `SearchInput`, `NumberInput`, `UrlInput`, `InputBox`, `Input`, `CheckBox`, `RadioButton`, `ToggleSwitch`, `Slider`                                                   |
| Selection             | `Select`, `SelectLegacy`, `SelectFiltered`, `MultiSelect`, `MultiSelectFiltered`, `PaginatedSelectFiltered`, `PaginatedMultiSelectFiltered`, `AutoComplete`                                                                       |
| Menus and lists       | `Menu`, `MenuItem`, `MenuSection`, `MenuSubmenuTrigger`, `Item` (+ `ItemContent`, `ItemTitle`, `ItemIcon`, `ItemActions`…), `Option` (+ `OptionContent`, `OptionIcon`…), `CheckOption`, `Options`, `Dropdown`                     |
| Overlays              | `Modal` (+ `ModalHeader`, `ModalTitle`, `ModalContent`, `ModalFooter`…), `ModalBackdrop`, `Popover`, `Tooltip`, `PositionAnimated`, `AnimatedVisibility`                                                                          |
| Feedback              | `Callout`, `Banner`, `ToastBar`, `ProgressBar`, `Throbber`, `Skeleton`, `States` (+ `StatesIcon`, `StatesTitle`, `StatesSubtitle`, `StatesActions`…)                                                                              |
| Data display          | `Table` (+ `TableHead`, `TableBody`, `TableRow`, `TableCell`, `TableFoot`), `Pagination`, `Tabs`, `TabsItem`, `Accordion`, `AccordionItem`, `CodeSnippet`                                                                         |
| Indicators and media  | `Avatar`, `AvatarContainer`, `AvatarStack`, `Badge`, `Tag`, `StatusBullet`, `Icon`, `FramedIcon`, `Chevron`, `Bubble`, `AudioPlayer`                                                                                              |
| Application structure | `Sidebar` and its parts, `Sidepanel` and its parts, `NavBar` (+ `NavBarGroup`, `NavBarItem`, `NavBarSection`, `NavBarDivider`), `Contextualbar` and its parts                                                                     |
| Messages              | `Message` and its parts (`MessageHeader`, `MessageBody`, `MessageToolbar`, `MessageReactions`, `ThreadMessage`, `MessageSystem`…)                                                                                                 |

Other exports:

- `PaletteStyleTag` — injects the theme palette as CSS custom properties.
- `Palette` — palette colors grouped as `surface`, `text`, `stroke`, `status`, `statusColor`, `badge` and `shadow`.
- `OwnerDocument` and `useOwnerDocument` — context for rendering into a document other than `window.document`, such as a pop-out window.
- Token helpers used by `Box` (`spacing`, `size`, `color`, `backgroundColor`, `fontColor`, `fontScale`, `borderRadius`…).
- `useCursor` — keyboard cursor over a list of options, for building custom dropdowns.

Each component's source and stories live in [`src/components`](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/fuselage/src/components). To browse them interactively, run Storybook locally (see below).

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/fuselage). From the repository root:

```sh
yarn workspace @rocket.chat/fuselage build
yarn workspace @rocket.chat/fuselage start
yarn workspace @rocket.chat/fuselage testunit
yarn workspace @rocket.chat/fuselage typecheck
yarn workspace @rocket.chat/fuselage lint
yarn workspace @rocket.chat/fuselage lint:fix
```

`start` rebuilds the development bundle on every change.

Storybook documents every component:

```sh
yarn workspace @rocket.chat/fuselage storybook
yarn workspace @rocket.chat/fuselage build-storybook
```

Visual regression tests compare Storybook screenshots:

```sh
yarn workspace @rocket.chat/fuselage visual-regression
yarn workspace @rocket.chat/fuselage visual-regression-update
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
