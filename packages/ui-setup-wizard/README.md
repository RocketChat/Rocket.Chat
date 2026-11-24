# `@rocket.chat/ui-setup-wizard`

> The setup wizard that a new Rocket.Chat workspace shows before anyone can use it: it creates the first admin, collects the organization info and registers the workspace with Rocket.Chat Cloud.

This is a private package of the monorepo, consumed by the Meteor web client (`apps/meteor`). The screens themselves come from [`@rocket.chat/onboarding-ui`](../onboarding-ui). This package connects them to the server.

## Usage

The package exports two things:

| Export | What it does |
| --- | --- |
| `SetupWizardRoute` | Lazy-loaded component that renders the wizard at `/setup-wizard/:step?`. |
| `useRedirectToSetupWizard` | Hook that sends the user to the wizard while the workspace still needs to be set up. |

Register the route with the id `setup-wizard`:

```tsx
import { SetupWizardRoute } from '@rocket.chat/ui-setup-wizard';

const routes = [
	{
		path: '/setup-wizard/:step?',
		id: 'setup-wizard',
		element: <SetupWizardRoute />,
	},
];
```

Call the redirect hook from the main layout:

```tsx
import { useRedirectToSetupWizard } from '@rocket.chat/ui-setup-wizard';

const AppLayout = () => {
	useRedirectToSetupWizard();
	// ...
};
```

`SetupWizardRoute` is lazy, so render it inside a `Suspense` boundary. It expects the providers the web client already sets up: the `@rocket.chat/ui-contexts` contexts, a TanStack Query `QueryClientProvider` and an i18next instance.

## Development

Run the scripts from the repository root with `yarn workspace @rocket.chat/ui-setup-wizard <script>`, or with `yarn <script>` inside this folder:

| Script | What it does |
| --- | --- |
| `build` | Compiles to `dist/`. |
| `dev` | Same as `build`, in watch mode. |
| `storybook` | Starts Storybook. |
| `test` | Runs the tests. |
| `typecheck` | Type-checks without emitting. |
| `lint` / `lint:fix` | Runs the linter. |

The web client imports the package from `dist/`, so run `build` (or keep `dev` running) after changing it.
