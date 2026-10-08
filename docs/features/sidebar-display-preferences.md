# Sidebar display preferences

How a user chooses what each sidebar room row looks like. The controls live in the navbar **Display** menu and in
**Account › Preferences › Sidebar**; workspace admins set the defaults under
`Accounts_Default_User_Preferences_*`.

## Three independent controls

| Preference | Values | Controls |
| --- | --- | --- |
| `sidebarViewMode` | `condensed`, `extended` | Spacing: the breathing room inside a row and the space between rows |
| `sidebarDisplayAvatar` + `sidebarAvatarSize` | off, or `small` / `medium` / `large` | Whether the room avatar shows, and how big |
| `sidebarDisplayPreview` | on / off | A second line with the room's last message and its time |

Each one changes a single aspect of the row, so every combination is valid and none of them changes what another
one means. Before, each view mode was a separate row template that fixed the avatar size and whether the last
message showed, so some combinations rendered identically (Medium without avatars looked like Condensed) and the
last message was only reachable through the tallest rows.

## How a row is laid out

- A row is as tall as its content or its avatar, whichever is taller, plus the view mode's padding. The avatar can
  make a row taller; it never makes it shorter.
- A small avatar sits inline before the room name. Medium and large avatars get their own column when the preview is
  on.
- Extended adds space between rows; the rows themselves keep the same internal spacing as Condensed when the preview
  is on.
- The preview text never takes the unread highlight. Only the room name does.

The sizes live in `apps/meteor/client/sidebar/Item/sidebarItemLayout.ts`, the single place to tune them.

## The message preview depends on the workspace

The preview reads the room's last message, which only exists when the admin setting **Store last message**
(`Store_Last_Message`) is on. When it is off, the preview toggle is disabled and explains why, whatever the user
had chosen.

## Upgrading from three view modes

`medium` used to be a view mode. Migration 336 maps every old combination to the one closest to what the user saw:

| Before | After |
| --- | --- |
| Condensed | Condensed, small avatar |
| Medium | Condensed, medium avatar |
| Extended | Extended, large avatar, preview on |

Whether avatars were shown is kept. The admin default goes through the same mapping. Condensed and Medium users see
the same rows as before; Extended users get the same avatar and preview with the new Extended spacing (more space
around the preview and between rows). A `medium` value that still reaches the client (for example from an older app
through the API) reads as Condensed.

## Usage data

Workspace statistics report `sidebarDisplayPreferences`: how many active users are on each view mode and avatar
size, how many show avatars and the preview, and how many filter at least one category by activity.
