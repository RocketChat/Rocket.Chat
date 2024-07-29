# @rocket.chat/apps

## 0.1.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.1
  - @rocket.chat/model-typings@0.5.1
  </details>

## 0.1.0

### Minor Changes

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

### Patch Changes

- <details><summary>Updated dependencies [1240c874a5, eaf2f11a6c, 5f95c4ec6b, f75a2cb4bb, 4f72d62aa7, dfa49bdbb2]:</summary>

  - @rocket.chat/core-typings@6.10.0
  - @rocket.chat/model-typings@0.5.0
  </details>

## 0.1.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.7
  - @rocket.chat/model-typings@0.5.0-rc.7
  </details>

## 0.1.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.6
  - @rocket.chat/model-typings@0.5.0-rc.6
  </details>

## 0.1.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.5
  - @rocket.chat/model-typings@0.5.0-rc.5
  </details>

## 0.1.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.4
  - @rocket.chat/model-typings@0.5.0-rc.4
  </details>

## 0.1.0-rc.3

## 0.0.9

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.3
  - @rocket.chat/model-typings@0.5.0-rc.3
  </details>

## 0.1.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.2
  - @rocket.chat/model-typings@0.5.0-rc.2
  </details>

## 0.1.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.1
  - @rocket.chat/model-typings@0.5.0-rc.1
  </details>

## 0.1.0-rc.0

### Minor Changes

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

### Patch Changes

- <details><summary>Updated dependencies [1240c874a5, eaf2f11a6c, 5f95c4ec6b, f75a2cb4bb, 4f72d62aa7, dfa49bdbb2]:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.0
  - @rocket.chat/model-typings@0.5.0-rc.0

## 0.0.9

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.9.3
  - @rocket.chat/model-typings@0.4.4
  </details>

## 0.0.8

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.9.2
  - @rocket.chat/model-typings@0.4.3
  </details>

## 0.0.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.9.1
  - @rocket.chat/model-typings@0.4.2
  </details>

## 0.0.6

### Patch Changes

- <details><summary>Updated dependencies [ff4e396416, 70ab2a7b7b]:</summary>

  - @rocket.chat/core-typings@6.9.0
  - @rocket.chat/model-typings@0.4.1
  </details>

## 0.0.6-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.9.0-rc.2
  - @rocket.chat/model-typings@0.4.1-rc.2
  </details>

## 0.0.6-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.9.0-rc.1
  - @rocket.chat/model-typings@0.4.1-rc.1
  </details>

## 0.0.6-rc.0

### Patch Changes

- <details><summary>Updated dependencies [ff4e396416, 70ab2a7b7b]:</summary>

  - @rocket.chat/core-typings@6.9.0-rc.0
  - @rocket.chat/model-typings@0.4.1-rc.0
  </details>

## 0.0.5

### Patch Changes

- ([#32374](https://github.com/RocketChat/Rocket.Chat/pull/32374)) Fixed an issue with some apps that didn't implement executeViewCloseHandler. This causes opened modals to be open forever on UI (unless Esc was clicked). This is because when the UI attempts to close it, it calls the aforementioned handler, and since it didn't exist, apps engine errored out.

  This returned an empty response to the UI, which ignored the response and continued to show the view.

- <details><summary>Updated dependencies [c47a8e3514, da45cb6998, b94ca7c30b, 4aba7c8a26]:</summary>

  - @rocket.chat/core-typings@6.8.0
  - @rocket.chat/model-typings@0.4.0
  </details>

## 0.0.5-rc.2

### Patch Changes

- ([#32374](https://github.com/RocketChat/Rocket.Chat/pull/32374)) Fixed an issue with some apps that didn't implement executeViewCloseHandler. This causes opened modals to be open forever on UI (unless Esc was clicked). This is because when the UI attempts to close it, it calls the aforementioned handler, and since it didn't exist, apps engine errored out.

  This returned an empty response to the UI, which ignored the response and continued to show the view.

- <details><summary>Updated dependencies [b94ca7c30b]:</summary>

  - @rocket.chat/core-typings@6.8.0-rc.2
  - @rocket.chat/model-typings@0.4.0-rc.2
  </details>

## 0.0.5-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.8.0-rc.1
  - @rocket.chat/model-typings@0.4.0-rc.1
  </details>

## 0.0.5-rc.0

### Patch Changes

- <details><summary>Updated dependencies [c47a8e3514, da45cb6998, 4aba7c8a26]:</summary>

  - @rocket.chat/core-typings@6.8.0-rc.0
  - @rocket.chat/model-typings@0.4.0-rc.0

## 0.0.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.7.2
  - @rocket.chat/model-typings@0.3.9
  </details>

## 0.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.7.1
  - @rocket.chat/model-typings@0.3.8
  </details>

## 0.0.2

### Patch Changes

- <details><summary>Updated dependencies [b9ef630816, 3eb4dd7f50, 0570f6740a, b9e897a8f5]:</summary>

  - @rocket.chat/core-typings@6.7.0
  - @rocket.chat/model-typings@0.3.7
  </details>

## 0.0.2-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.7.0-rc.4
  - @rocket.chat/model-typings@0.3.7-rc.4
  </details>

## 0.0.2-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.7.0-rc.3
  - @rocket.chat/model-typings@0.3.7-rc.3
  </details>

## 0.0.2-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.7.0-rc.2
  - @rocket.chat/model-typings@0.3.7-rc.2
  </details>

## 0.0.2-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.7.0-rc.1
  - @rocket.chat/model-typings@0.3.7-rc.1
  </details>

## 0.0.2-rc.0

### Patch Changes

- <details><summary>Updated dependencies [b9ef630816, 3eb4dd7f50, 0570f6740a, b9e897a8f5]:</summary>

  - @rocket.chat/core-typings@6.7.0-rc.0
  - @rocket.chat/model-typings@0.3.7-rc.0
  </details>
