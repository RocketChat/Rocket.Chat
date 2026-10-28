# `@rocket.chat/onboarding-ui`

> Ready-made React pages and forms for Rocket.Chat's onboarding, login, registration and password recovery screens.

[![npm](https://img.shields.io/npm/v/@rocket.chat/onboarding-ui?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/onboarding-ui) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/onboarding-ui?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/onboarding-ui)

This package holds the full-page screens a user sees before entering a Rocket.Chat workspace: the setup wizard, workspace registration, cloud workspace creation, trial requests, login, account creation and password reset. Each page is a presentational component. It renders the UI and validates input, and hands every action back to you through callbacks such as `onSubmit`, `onLogin` or `onBackButtonClick`.

Pages are built with [Fuselage](https://www.npmjs.com/package/@rocket.chat/fuselage) and [`@rocket.chat/layout`](https://www.npmjs.com/package/@rocket.chat/layout). Forms use [React Hook Form](https://react-hook-form.com/), and all text goes through [react-i18next](https://react.i18next.com/).

## Installation

```sh
npm install @rocket.chat/onboarding-ui @rocket.chat/fuselage @rocket.chat/fuselage-hooks @rocket.chat/icons @rocket.chat/layout @rocket.chat/logo @rocket.chat/styled react react-dom react-i18next i18next react-virtuoso
```

All the packages after `@rocket.chat/onboarding-ui` are peer dependencies, except two: `i18next`, which `react-i18next` needs and the setup below imports, and `react-virtuoso`, a peer dependency of Fuselage. The package ships both CommonJS and ES modules, with TypeScript declarations.

Load Fuselage's styles and the icon font once in your app:

```ts
import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';
```

## Usage

### Setup

The pages expect three things around them:

- An i18next instance provided through `react-i18next`. The package does not ship translations; your resources must contain its keys (for example `form.adminInfoForm.title` or `component.form.action.next`). The English source strings live in [`.i18n/en.i18n.json`](https://github.com/RocketChat/Rocket.Chat/blob/develop/packages/onboarding-ui/.i18n/en.i18n.json) in the repository; they are not included in the npm package.
- A `DarkModeProvider` from `@rocket.chat/layout`. Without it, most pages render in dark mode regardless of the user's preference.
- Fuselage's `PaletteStyleTag`, which injects the color palette for the chosen theme.

```tsx
import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { DarkModeProvider } from '@rocket.chat/layout';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import translation from './en.i18n.json';

const i18n = i18next.createInstance().use(initReactI18next);
i18n.init({ lng: 'en', resources: { en: { translation } } });

export const OnboardingProviders = ({ children }: { children: ReactNode }) => (
	<I18nextProvider i18n={i18n}>
		<DarkModeProvider.default>
			<PaletteStyleTag />
			{children}
		</DarkModeProvider.default>
	</I18nextProvider>
);
```

Pass `forcedDarkMode` to `DarkModeProvider.default` to pin a theme, and the matching `theme` to `PaletteStyleTag`.

### A login page

```tsx
import { LoginPage, type LoginFormPayload } from '@rocket.chat/onboarding-ui';

const Login = () => {
	const handleSubmit = async ({ email, password }: LoginFormPayload) => {
		await signIn(email, password);
	};

	return (
		<LoginPage
			isPasswordLess={false}
			isMfa={false}
			onSubmit={handleSubmit}
			onChangeForm={() => undefined}
			onResetPassword={() => navigate('/reset-password')}
			onCreateAccount={() => navigate('/register')}
		/>
	);
};
```

`signIn` and `navigate` stand in for your own code.

### A setup wizard step

Wizard pages take `currentStep` and `stepCount` and show a "Step X of Y" caption. Validators follow React Hook Form's `validate` signature: return `true` when the value is valid, or an error message.

```tsx
import { AdminInfoPage, type AdminInfoPayload } from '@rocket.chat/onboarding-ui';

const AdminStep = ({ onNext }: { onNext: (data: AdminInfoPayload) => void }) => (
	<AdminInfoPage
		currentStep={1}
		stepCount={4}
		passwordRulesHint='At least 8 characters.'
		validateUsername={(username) => /^[\w.-]+$/.test(username) || 'Invalid username'}
		validateEmail={(email) => email.includes('@') || 'Invalid email'}
		validatePassword={(password) => password.length >= 8 || 'Password too short'}
		onSubmit={onNext}
	/>
);
```

### Status pages

Some pages only show a message and need few or no props:

```tsx
import { EmailConfirmedPage, InformationPage, SomethingWentWrongPage } from '@rocket.chat/onboarding-ui';

<EmailConfirmedPage />
<InformationPage title='Workspace removed' description='You can close this tab.' />
<SomethingWentWrongPage requestId='a1b2c3' />
```

## API

Every page is the default UI for one screen. Props marked with `?` are optional. `Validate`, `SubmitHandler` and `FieldPathValue` are React Hook Form types; `SelectOption` is Fuselage's `[value: string, label: string, selected?: boolean]` tuple.

### Setup wizard and registration

| Export                     | Main props                                                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AdminInfoPage`            | `currentStep`, `stepCount`, `passwordRulesHint`, `validateUsername`, `validateEmail`, `validatePassword`, `onSubmit(AdminInfoPayload)`, `initialValues?`, `keepPosted?`, `title?`, `description?`                                                       |
| `OrganizationInfoPage`     | `currentStep`, `stepCount`, `organizationIndustryOptions`, `organizationSizeOptions`, `countryOptions`, `onSubmit(OrganizationInfoPayload)`, `initialValues?`, `nextStep?`, `onBackButtonClick?`, `onClickSkip?`, `title?`, `subtitle?`, `description?` |
| `RegisterServerPage`       | `currentStep`, `stepCount`, `onSubmit(RegisterServerPayload)`, `onClickRegisterOffline`, `initialValues?`, `offline?`, `validateEmail?`, `termsHref?`, `policyHref?`                                                                                    |
| `RegisterOfflinePage`      | `clientKey`, `termsHref`, `policyHref`, `onSubmit(RegisterOfflinePayload)`, `onCopySecurityCode`, `onBackButtonClick`                                                                                                                                   |
| `AwaitingConfirmationPage` | `currentStep`, `stepCount`, `emailAddress`, `securityCode`, `onResendEmailRequest`, `onChangeEmailRequest`, `title?`, `description?`                                                                                                                    |
| `CreateFirstMemberPage`    | Same props as `CreateFirstMemberForm`.                                                                                                                                                                                                                  |

### Cloud workspace and trial

| Export                     | Main props                                                            |
| -------------------------- | --------------------------------------------------------------------- |
| `CreateCloudWorkspacePage` | Same props as `CreateCloudWorkspaceForm`.                             |
| `RequestTrialPage`         | Same props as `RequestTrialForm`.                                     |
| `CheckYourEmailPage`       | `onResendEmailRequest`, `onChangeEmailRequest`, `title?`, `children?` |
| `ConfirmationProcessPage`  | None.                                                                 |
| `EmailConfirmedPage`       | None.                                                                 |
| `InvalidLinkPage`          | `onRequestNewLink`                                                    |

### Login and accounts

| Export                          | Main props                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LoginPage`                     | `isPasswordLess`, `isMfa`, `onSubmit(LoginFormPayload)`, `onChangeForm`, `onResetPassword`, `onCreateAccount`, `initialValues?`, `formError?`, `mfaProps?: TotpFormProps` |
| `LoginLinkEmailPage`            | `onResendEmailRequest`, `onChangeEmailRequest`                                                                                                                            |
| `CreateNewAccountPage`          | `validateEmail`, `validatePassword`, `validateConfirmationPassword`, `onSubmit(NewAccountPayload)`, `onLogin`, `initialValues?`                                           |
| `ResetPasswordPage`             | `validateEmail`, `onSubmit(ResetPasswordFormPayload)`, `onLogin`, `initialValues?`                                                                                        |
| `ResetPasswordConfirmationPage` | None.                                                                                                                                                                     |
| `CreateNewPasswordPage`         | `validatePassword`, `validatePasswordConfirmation`, `onSubmit(CreateNewPasswordPayload)`, `onLogin`, `initialValues?`                                                     |
| `OauthAuthorizationPage`        | `onClickAuthorizeOAuth`, `error: { message?, onGoBack? }`, `clientName?`                                                                                                  |

`TotpFormProps` is `{ onSubmit(TotpFormPayload), onChangeTotpForm, initialValues?, isBackupCode?, formError? }`.

### Generic pages

| Export                   | Main props                                                   |
| ------------------------ | ------------------------------------------------------------ |
| `InformationPage`        | `title`, `description?`                                      |
| `LoaderPage`             | `title`, `subtitles: string[]`, `isReady`, `loadingSeconds?` |
| `RedirectPage`           | `title`, `countDownSeconds`, `onRedirect`                    |
| `SomethingWentWrongPage` | `requestId?`                                                 |

### Forms

Three forms are exported on their own, so they can be placed in a custom page:

| Export                     | Main props                                                                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CreateCloudWorkspaceForm` | `onSubmit(CreateCloudWorkspaceFormPayload)`, `serverRegionOptions`, `languageOptions`, `domain`, `validateUrl`, `validateEmail`, `defaultValues?`, `onBackButtonClick?` |
| `CreateFirstMemberForm`    | `currentStep`, `stepCount`, `organizationName`, `onSubmit(CreateFirstMemberFormPayload)`, `onBackButtonClick`, `validateUsername`, `validatePassword`, `defaultValues?` |
| `RequestTrialForm`         | `onSubmit(RequestTrialPayload)`, `organizationSizeOptions`, `countryOptions`, `onManageWorkspaceClick`, `validateEmail`, `defaultValues?`, `termsHref?`, `policyHref?`  |

### Payload types

Each `onSubmit` receives a typed payload. These types are exported:

| Type                              | Fields                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `AdminInfoPayload`                | `fullname`, `username`, `email`, `password`, `keepPosted?`                                               |
| `LoginFormPayload`                | `email`, `password?`                                                                                     |
| `TotpFormPayload`                 | `totpCode`, `backupCode`                                                                                 |
| `CreateFirstMemberFormPayload`    | `username`, `password`                                                                                   |
| `CreateCloudWorkspaceFormPayload` | `organizationEmail`, `workspaceName`, `workspaceURL`, `serverRegion`, `language`, `agreement`, `updates` |
| `RequestTrialPayload`             | `email`, `organizationName`, `organizationSize`, `country`, `updates`, `agreement`                       |

`NewAccountPayload`, `CreateNewPasswordPayload`, `OrganizationInfoPayload`, `RegisterServerPayload`, `RegisterOfflinePayload` and `ResetPasswordFormPayload` are exported as well. Each page and form also exports its props type (for example `LoginPageProps`).

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/onboarding-ui). From the repository root:

```sh
yarn workspace @rocket.chat/onboarding-ui build
yarn workspace @rocket.chat/onboarding-ui testunit
yarn workspace @rocket.chat/onboarding-ui typecheck
yarn workspace @rocket.chat/onboarding-ui lint
```

Pages are developed in Storybook, which loads the English strings from `.i18n/en.i18n.json`:

```sh
yarn workspace @rocket.chat/onboarding-ui storybook
yarn workspace @rocket.chat/onboarding-ui build-storybook
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
