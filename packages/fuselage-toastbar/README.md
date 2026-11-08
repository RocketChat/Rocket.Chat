# `@rocket.chat/fuselage-toastbar`

> A toast notification queue for React apps built with Fuselage.

[![npm](https://img.shields.io/npm/v/@rocket.chat/fuselage-toastbar?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/fuselage-toastbar) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/fuselage-toastbar?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/fuselage-toastbar)

`@rocket.chat/fuselage` provides the `ToastBar` component; this package manages a list of them. Wrap your app in `ToastBarProvider`, then call `useToastBarDispatch()` from any component to show a toast.

- Toasts render in a portal attached to `document.body`, in one of four corners.
- Timed toasts have a close button, close themselves after a few seconds, and pause while the pointer is over them.
- Persistent toasts have no timer and no close button.
- The corner positions flip in right-to-left layouts.

## Installation

```sh
npm install @rocket.chat/fuselage-toastbar @rocket.chat/fuselage @rocket.chat/styled react react-dom
```

`@rocket.chat/fuselage`, `@rocket.chat/styled`, `react` and `react-dom` are peer dependencies. `@rocket.chat/fuselage` has its own peer dependencies and stylesheet; see its README.

The package ships CommonJS and ES module builds with TypeScript declarations.

## Usage

Render `ToastBarProvider` once, near the root of your app:

```tsx
import { ToastBarProvider } from '@rocket.chat/fuselage-toastbar';
import type { ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
	return <ToastBarProvider>{children}</ToastBarProvider>;
}
```

Then dispatch toasts from any component inside it:

```tsx
import { Button } from '@rocket.chat/fuselage';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';

function SaveButton({ save }: { save: () => Promise<void> }) {
	const dispatchToastMessage = useToastBarDispatch();

	const handleClick = async () => {
		try {
			await save();
			dispatchToastMessage({ type: 'success', message: 'Changes saved' });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as Error, time: 10, position: 'bottom-start' });
		}
	};

	return <Button onClick={handleClick}>Save</Button>;
}
```

An `Error` passed as `message` is rendered as its string form.

### Persistent toasts

Set `isPersistent` to keep a toast on screen without a timer:

```tsx
dispatchToastMessage({ type: 'info', title: 'Maintenance', message: 'The server restarts at 22:00 UTC.', isPersistent: true });
```

A persistent toast stays until the provider unmounts: it has no close button, and `dispatch` does not return the id that `useToastBarDismiss()` needs.

## API

### `ToastBarProvider`

Holds the toast queue and renders it. Props: `children`.

### `useToastBarDispatch()`

Returns `dispatch(toast)`, which adds a toast to the queue. `toast` is an object with:

| Field          | Type                                                         | Default     | Description                                         |
| -------------- | ------------------------------------------------------------ | ----------- | --------------------------------------------------- |
| `message`      | `ReactNode \| Error`                                         | —           | The toast content. Required.                        |
| `type`         | `'success' \| 'info' \| 'error'`                             | `'info'`    | The `ToastBar` variant.                             |
| `title`        | `string`                                                     | —           | Text rendered before the message.                   |
| `position`     | `'top-start' \| 'top-end' \| 'bottom-start' \| 'bottom-end'` | `'top-end'` | The corner of the viewport where the toast appears. |
| `time`         | `number`                                                     | `5`         | Seconds before a timed toast closes.                |
| `isPersistent` | `boolean`                                                    | `false`     | Keeps the toast open with no timer or close button. |

### `useToastBarDismiss()`

Returns `dismiss(id)`, which removes the toast with that `id`. Timed toasts call it when their timer ends or their close button is clicked.

### Other exports

- `ToastBar` and `ToastBarProps` — re-exported from `@rocket.chat/fuselage`.
- `ToastBarPortal` — the portal the provider renders into. It adds a `#toastBarRoot` element to `document.body` and removes it when the last portal unmounts.
- `ToastBarContext`, and the types `ToastBarPayload`, `ToastBarContextValue`, `ToastBarProviderProps` and `ToastBarPortalProps` — for custom providers and tests.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/fuselage-toastbar). From the repository root:

```sh
yarn workspace @rocket.chat/fuselage-toastbar build
yarn workspace @rocket.chat/fuselage-toastbar testunit
yarn workspace @rocket.chat/fuselage-toastbar typecheck
yarn workspace @rocket.chat/fuselage-toastbar lint
yarn workspace @rocket.chat/fuselage-toastbar lint:fix
```

Run Storybook to try the toasts interactively:

```sh
yarn workspace @rocket.chat/fuselage-toastbar storybook
yarn workspace @rocket.chat/fuselage-toastbar build-storybook
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
