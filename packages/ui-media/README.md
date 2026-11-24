# `@rocket.chat/ui-media`

> The media pieces that Rocket.Chat's voice calls and video conferences share: device lists and menus, the microphone permission prompt, stream playback and call controls.

Rocket.Chat has two call UIs: voice calls, in [`@rocket.chat/ui-voip`](../ui-voip/), and video conferences, in [`@rocket.chat/ui-conference`](../ui-conference/) with the LiveKit client in [`@rocket.chat/ui-livekit`](../ui-livekit/). Both work with the same browser media APIs, and each used to keep its own copy of the code around them. This package holds the one copy they share. The app in `apps/meteor` also reads its device list from here.

The package is private: only workspaces in this monorepo use it, and it is not published to npm.

## What belongs here

Code that both call UIs need about the browser's media: devices, capture permissions, streams, and the controls drawn around them. Code that only one of them uses stays in that package. Call state, signaling and a call provider's SDK never come here. Shared call code goes here, not into [`@rocket.chat/ui-client`](../ui-client/).

## What it offers

### Devices

- **`useMediaDevices()`** returns every camera, microphone and speaker the browser lists, and keeps the list current as devices are plugged in or removed. Every reader shares one list, and the package listens to the browser only while something reads it.

  Browsers leave device labels empty until the user grants a capture permission, and Safari does not announce the grant. Code that obtains a stream calls **`refreshMediaDevices()`** to read the names. The permission hooks below already do.

- **`DeviceSelectionProvider`** and **`useDeviceSelection()`** carry the devices on offer, the device chosen for each kind, and a `select` function. The package does not decide where a choice is kept: each screen provides its own. The voice call keeps it in the app's selected devices. The conference preflight keeps the user's stored choices. A running conference switches the call's tracks.
- **`DeviceMenu`** lists the devices of the given kinds and chooses through the nearest `DeviceSelectionProvider`. It can add sections of other options below the devices, such as noise suppression or video quality. **`DeviceMenuButton`** is its trigger.
- **`deviceMenuSelection()`** returns the menu's rows and the device in use, for screens that show them outside the menu. A label next to a toggle then names the same device the menu would.
- **`deviceName()`, `orderDevices()`, `isSameDevice()`, `deviceGroupsOf()` and `SYSTEM_DEFAULT_DEVICE_ID`** show devices the way people expect. Browsers list the system default twice: once as the `default` alias and once under its own id. They also add USB vendor ids and a "Default - " prefix to labels. These helpers keep the alias and drop its duplicate, clean up the names, and treat the alias and its duplicate as the same hardware.

### Permissions

- **`useDevicePermissionPrompt2()`** returns a function that resolves with a microphone stream. If the permission is not granted, it shows **`PermissionFlowModal`** first. The modal's wording depends on `actionType`: an incoming call, an outgoing call or a device change. If the user closes the modal, the function rejects with **`PermissionRequestCancelledCallRejectedError`**, and the caller goes on without a microphone.
- **`useRevealDeviceLabels()`** is meant for a `DeviceMenu`'s `beforeOpen`. If the devices of the menu's kinds are not named yet, it asks for the permission that names them, then reads the list again. Unnamed devices cannot be told apart, so a menu of them is no help.
- **`stopTracks(stream)`** releases a stream that was only requested to get the permission.

### Streams

- **`StreamVideo`** plays a stream in a muted `<video>` that fills its box. Use `fit='cover'` for a camera tile, `fit='contain'` for a shared screen, and `mirrored` for a self-view. The call's audio plays elsewhere.
- **`usePlayMediaStream(stream)`** returns the ref that `StreamVideo` uses. Put it on an `<audio>` element to play a call's sound. When the same stream arrives inside a new object, it is not attached again, so a camera does not blink when something unrelated changes.
- **`useAudioLevel(stream)`** returns how loud a stream is, from 0 to 1, about twelve times a second. A stream without audio reads 0. Every reader of the same stream shares one measurement.

### Controls

- **`ActionButton`** is a one-shot call action, such as hanging up (`danger`). With `splitButtonTrigger` it renders as the menu segment of a Fuselage `SplitButton`.
- **`ToggleButton`** is a two-state control, such as mute or camera. Its label stays the same for assistive technology, while its icon and title follow the state. Set `dangerWhenPressed` when the pressed state is a warning, like a muted microphone. Set `info` when it is an activity, like a shared screen or a raised hand.

Both come in three sizes. The conference uses `large`, and the voice call uses `medium` and `tiny`.

### Contexts

- **`createRequiredContext(name)`** returns a provider and a hook that throws when it is used outside that provider. The device selection is built on it, and so are the conference's own contexts.

## Usage

A menu of the audio devices, choosing through a caller-provided `select`:

```tsx
import type { DeviceSelection } from '@rocket.chat/ui-media';
import { DeviceMenu, DeviceMenuButton, DeviceSelectionProvider, useMediaDevices, useRevealDeviceLabels } from '@rocket.chat/ui-media';
import { useTranslation } from 'react-i18next';

type AudioDevicePickerProps = Pick<DeviceSelection, 'selectedIds' | 'select'>;

const AudioDevicePicker = ({ selectedIds, select }: AudioDevicePickerProps) => {
	const { t } = useTranslation();
	const { devices } = useMediaDevices();
	const revealDeviceLabels = useRevealDeviceLabels();

	return (
		<DeviceSelectionProvider value={{ devices, selectedIds, select }}>
			<DeviceMenu
				kinds={['audioinput', 'audiooutput']}
				title={t('Device_settings_lowercase')}
				placement='top-end'
				beforeOpen={() => revealDeviceLabels(['audioinput', 'audiooutput'], devices)}
				button={<DeviceMenuButton label={t('Device_settings_lowercase')} menuIcon='customize' size='medium' />}
			/>
		</DeviceSelectionProvider>
	);
};
```

The voice call's [`DevicePicker`](../ui-voip/src/components/DevicePicker.tsx) is the full version.

### Providers it needs

`useMediaDevices`, `useAudioLevel`, `StreamVideo` and the buttons need nothing beyond React and Fuselage. The rest run inside the app's providers:

- `DeviceMenu` uses `GenericMenu` from `@rocket.chat/ui-client` and Rocket.Chat's translations.
- The permission hooks read `@rocket.chat/ui-contexts` (modals, the microphone permission, the selected devices) and a react-query client.
- `PermissionFlowModal` reads the workspace URL from `@rocket.chat/ui-contexts`.

Translation keys live in `@rocket.chat/i18n` (see [docs/i18n.md](../../docs/i18n.md)). In stories and tests, wrap components with `mockAppRoot()` from `@rocket.chat/mock-providers`, as this package's own specs do.

## Development

From the repository root:

```sh
yarn workspace @rocket.chat/ui-media build      # compile to dist/
yarn workspace @rocket.chat/ui-media dev        # compile on every change
yarn workspace @rocket.chat/ui-media testunit
yarn workspace @rocket.chat/ui-media typecheck
yarn workspace @rocket.chat/ui-media lint
yarn workspace @rocket.chat/ui-media storybook
```

Other workspaces import the compiled `dist/`, not the source. The root `yarn dev` runs this package's `dev` along with the app's. When you work on it from another package's tests or Storybook, run `dev` here or `build` first.

## Related documentation

- [Video conferences](../../docs/features/video-conference.md): how a conference is modelled on the server
- [Video conference persistent chat](../../docs/features/video-conference-persistent-chat/README.md): the in-product conference page and its chat
- [LiveKit native video conference](../../docs/features/native-video-conference/README.md): where a native call runs
