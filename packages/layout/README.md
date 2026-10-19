# `@rocket.chat/layout`

> React page layouts and building blocks for Rocket.Chat's full-screen pages, such as setup wizards, login and registration.

[![npm](https://img.shields.io/npm/v/@rocket.chat/layout?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/layout) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/layout?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/layout)

This package provides the page shells used by Rocket.Chat's standalone screens: a patterned background, the logo, a centered or two-column arrangement, and a form card. The pages in [`@rocket.chat/onboarding-ui`](https://www.npmjs.com/package/@rocket.chat/onboarding-ui) are built on it.

It is built with [Fuselage](https://www.npmjs.com/package/@rocket.chat/fuselage) components and supports light and dark mode.

- Three layouts: `HeroLayout`, `VerticalWizardLayout` and `HorizontalWizardLayout`.
- Form building blocks: `Form`, `FormHeader`, `FormTitle`, `FormSubtitle`, `FormSteps`, `FormContainer`, `FormFooter`.
- Smaller pieces: `BackgroundLayer`, `LayoutLogo`, `ActionLink`, `TooltipWrapper`, `List` and `ListItem`.
- Custom logo and background image per color scheme.

## Installation

```sh
npm install @rocket.chat/layout @rocket.chat/fuselage @rocket.chat/icons react@19 react-dom@19 react-i18next i18next react-virtuoso
```

Peer dependencies: `@rocket.chat/fuselage`, `react` and `react-dom` (19 or later) and `react-i18next` (which itself needs `i18next`). `@rocket.chat/icons` and `react-virtuoso` are peer dependencies of Fuselage, and the icon font comes from `@rocket.chat/icons`. The package ships both CommonJS and ES modules, with TypeScript declarations.

The components rely on Fuselage's styles and on the Rocket.Chat icon font. Load them once in your app:

```ts
import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';
```

## Usage

### A centered form page

```tsx
import { Button, Field, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import {
	Form,
	FormContainer,
	FormFooter,
	FormHeader,
	FormSubtitle,
	FormTitle,
	VerticalWizardLayout,
	VerticalWizardLayoutFooter,
	VerticalWizardLayoutForm,
	VerticalWizardLayoutTitle,
} from '@rocket.chat/layout';

const SignInPage = () => (
	<VerticalWizardLayout>
		<VerticalWizardLayoutTitle>Welcome back</VerticalWizardLayoutTitle>
		<VerticalWizardLayoutForm>
			<Form onSubmit={(event) => event.preventDefault()}>
				<FormHeader>
					<FormTitle>Sign in</FormTitle>
					<FormSubtitle>Use your workspace account.</FormSubtitle>
				</FormHeader>
				<FormContainer>
					<Field>
						<FieldLabel>Email</FieldLabel>
						<FieldRow>
							<TextInput type='email' />
						</FieldRow>
					</Field>
				</FormContainer>
				<FormFooter>
					<Button primary type='submit'>
						Continue
					</Button>
				</FormFooter>
			</Form>
		</VerticalWizardLayoutForm>
		<VerticalWizardLayoutFooter>New here? Create an account.</VerticalWizardLayoutFooter>
	</VerticalWizardLayout>
);
```

### A two-column wizard step

`HorizontalWizardLayout` puts the logo and a pitch on one side and the form on the other.

```tsx
import {
	ActionLink,
	Form,
	FormHeader,
	FormSteps,
	FormTitle,
	HorizontalWizardLayout,
	HorizontalWizardLayoutAside,
	HorizontalWizardLayoutContent,
	HorizontalWizardLayoutDescription,
	HorizontalWizardLayoutSubtitle,
	HorizontalWizardLayoutTitle,
	HorizontalWizardTextHighlight,
} from '@rocket.chat/layout';

const SetupStep = () => (
	<HorizontalWizardLayout>
		<HorizontalWizardLayoutAside>
			<HorizontalWizardLayoutTitle>
				Set up your <HorizontalWizardTextHighlight>workspace</HorizontalWizardTextHighlight>
			</HorizontalWizardLayoutTitle>
			<HorizontalWizardLayoutSubtitle>It takes a few minutes.</HorizontalWizardLayoutSubtitle>
			<HorizontalWizardLayoutDescription>
				Need help? <ActionLink href='https://docs.rocket.chat'>Read the docs</ActionLink>
			</HorizontalWizardLayoutDescription>
		</HorizontalWizardLayoutAside>
		<HorizontalWizardLayoutContent>
			<Form>
				<FormHeader>
					<FormSteps currentStep={1} stepCount={3} />
					<FormTitle>Admin info</FormTitle>
				</FormHeader>
				{/* fields */}
			</Form>
		</HorizontalWizardLayoutContent>
	</HorizontalWizardLayout>
);
```

### A message page

```tsx
import { HeroLayout, HeroLayoutSubtitle, HeroLayoutTitle } from '@rocket.chat/layout';

const EmailConfirmed = () => (
	<HeroLayout>
		<HeroLayoutTitle>Email confirmed</HeroLayoutTitle>
		<HeroLayoutSubtitle>You can close this tab.</HeroLayoutSubtitle>
	</HeroLayout>
);
```

### Custom logo, background and color scheme

All three layouts accept the same options:

```tsx
<VerticalWizardLayout
	logo={<img src='/logo.svg' alt='Acme' />}
	logoDark={<img src='/logo-dark.svg' alt='Acme' />}
	background='/background.png'
	backgroundDark='/background-dark.png'
	forceDarkMode={false}
>
	{/* ... */}
</VerticalWizardLayout>
```

Without `logo`, the Rocket.Chat logo is shown. Without `background`, a built-in pattern is drawn. Without `forceDarkMode`, the layout follows the user's `prefers-color-scheme`.

### Dark mode outside a layout

`BackgroundLayer`, `LayoutLogo`, `HorizontalWizardLayoutCaption` and `HorizontalWizardTextHighlight` read the color scheme from context. The layouts provide it. When you use these pieces on their own, wrap them in `DarkModeProvider`; with no provider, they render in dark mode.

```tsx
import { BackgroundLayer, DarkModeProvider } from '@rocket.chat/layout';

const Page = () => (
	<DarkModeProvider.default>
		<BackgroundLayer>{/* ... */}</BackgroundLayer>
	</DarkModeProvider.default>
);
```

`DarkModeProvider` is exported as a namespace: `DarkModeProvider.default` is the provider component and `DarkModeProvider.useDarkMode()` reads the current value.

### Translations

`FormSteps` is the only component with built-in text. It calls `t('component.form.steps', { currentStep, stepCount })` through `react-i18next`, so your i18next resources need that key, for example `"Step {{currentStep}} of {{stepCount}}"`.

## API

### Layouts

`HeroLayout`, `VerticalWizardLayout` and `HorizontalWizardLayout` take `children` and these optional props:

| Prop             | Type        | Description                                                              |
| ---------------- | ----------- | ------------------------------------------------------------------------ |
| `logo`           | `ReactNode` | Replaces the Rocket.Chat logo.                                           |
| `logoDark`       | `ReactNode` | Logo for dark mode. Defaults to `logo`.                                  |
| `background`     | `string`    | URL or data URI of the page background image.                            |
| `backgroundDark` | `string`    | Background for dark mode. Defaults to `background`.                      |
| `forceDarkMode`  | `boolean`   | Forces dark (`true`) or light (`false`) mode. Omit to follow the system. |

The `LayoutContextValue` type describes these props.

| Layout                   | Children components                                                                                                                                                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HeroLayout`             | `HeroLayoutTitle`, `HeroLayoutSubtitle`                                                                                                                                                                                                                                                   |
| `VerticalWizardLayout`   | `VerticalWizardLayoutTitle`, `VerticalWizardLayoutForm`, `VerticalWizardLayoutFooter`                                                                                                                                                                                                     |
| `HorizontalWizardLayout` | `HorizontalWizardLayoutAside` (renders the logo), `HorizontalWizardLayoutContent`, `HorizontalWizardLayoutTitle`, `HorizontalWizardLayoutSubtitle`, `HorizontalWizardLayoutDescription`, `HorizontalWizardLayoutCaption`, `HorizontalWizardLayoutFooter`, `HorizontalWizardTextHighlight` |

### Form building blocks

| Export           | Props                                      | Renders                                                                                                                                              |
| ---------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Form`           | `<form>` attributes, `children`            | A Fuselage `Tile` as a `<form>`, up to 576 px wide.                                                                                                  |
| `FormHeader`     | HTML attributes, `children`                | A `<header>` with bottom spacing.                                                                                                                    |
| `FormTitle`      | HTML attributes, `children`                | The form title.                                                                                                                                      |
| `FormSubtitle`   | HTML attributes, `children`                | Secondary text under the title.                                                                                                                      |
| `FormSteps`      | `currentStep: number`, `stepCount: number` | The translated "Step X of Y" caption.                                                                                                                |
| `FormContainer`  | Fuselage `Box` props                       | A plain `Box` for the fields.                                                                                                                        |
| `FormFooter`     | HTML attributes, `children`                | A `<footer>` that spreads its children across the row.                                                                                               |
| `FormPageLayout` | —                                          | Namespace of the styled primitives behind the layouts (`Wrapper`, `Aside`, `Content`, `Logo`, `Title`, `TitleHighlight`, `Subtitle`, `Description`). |

### Other components

| Export             | Props                                                                                                                     | Description                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `BackgroundLayer`  | `children`                                                                                                                | Full-page background with the pattern or custom image from the layout options.                  |
| `LayoutLogo`       | —                                                                                                                         | The logo from the layout options, or the Rocket.Chat logo, up to 224 px wide.                   |
| `ActionLink`       | `<a>` attributes, `children`, `href` (default `'#'`), `fontScale` (default `'p2'`)                                        | A link. When `onClick` is set, the default navigation is prevented.                             |
| `TooltipWrapper`   | `text: string`, `children: ReactElement \| ((params: AnchorParams) => ReactNode)`                                         | Shows `text` in a tooltip on hover and focus. A render function receives `{ ref, toggle, id }`. |
| `List`             | `children`, `spacing` (Fuselage margin, default `'x6'`), `listStyleType`, `color`, `icon` (SVG markup used as the bullet) | An unstyled `<ul>` with spacing between items.                                                  |
| `ListItem`         | `children`, `icon` (icon name), `iconColor` (default `'success'`), `fontScale` (default `'c1'`)                           | A list item with an optional leading icon.                                                      |
| `DarkModeProvider` | `default`: `{ children, forcedDarkMode?: boolean }`; `useDarkMode(): boolean`                                             | Color scheme context. See [Dark mode outside a layout](#dark-mode-outside-a-layout).            |

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/layout). From the repository root:

```sh
yarn workspace @rocket.chat/layout build
yarn workspace @rocket.chat/layout testunit
yarn workspace @rocket.chat/layout typecheck
yarn workspace @rocket.chat/layout lint
```

Components are developed in Storybook:

```sh
yarn workspace @rocket.chat/layout storybook
yarn workspace @rocket.chat/layout build-storybook
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
