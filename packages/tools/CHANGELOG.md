# @rocket.chat/tools

## 0.2.2

### Patch Changes

- ([#32527](https://github.com/RocketChat/Rocket.Chat/pull/32527)) Fixed an inconsistent evaluation of the `Accounts_LoginExpiration` setting over the codebase. In some places, it was being used as milliseconds while in others as days. Invalid values produced different results. A helper function was created to centralize the setting validation and the proper value being returned to avoid edge cases.
  Negative values may be saved on the settings UI panel but the code will interpret any negative, NaN or 0 value to the default expiration which is 90 days.

## 0.2.2-rc.0

### Patch Changes

- ([#32527](https://github.com/RocketChat/Rocket.Chat/pull/32527)) Fixed an inconsistent evaluation of the `Accounts_LoginExpiration` setting over the codebase. In some places, it was being used as milliseconds while in others as days. Invalid values produced different results. A helper function was created to centralize the setting validation and the proper value being returned to avoid edge cases.
  Negative values may be saved on the settings UI panel but the code will interpret any negative, NaN or 0 value to the default expiration which is 90 days.

## 0.2.1

### Patch Changes

- ([#31138](https://github.com/RocketChat/Rocket.Chat/pull/31138)) feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

## 0.2.1-rc.0

### Patch Changes

- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

## 0.2.0

### Minor Changes

- 92613680b7: Added option to select between two script engine options for the integrations

## 0.2.0-rc.0

### Minor Changes

- 92613680b7: Added option to select between two script engine options for the integrations

## 0.1.0

### Minor Changes

- 1041d4d361: Added option to select between two script engine options for the integrations

## 0.1.0-rc.0

### Minor Changes

- 1041d4d361: Added option to select between two script engine options for the integrations
