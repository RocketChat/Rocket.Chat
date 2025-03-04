---
'@rocket.chat/meteor': patch
---

Fixes the save button loading state in the app settings page. The button now exits the loading state after settings are successfully saved. This resolves an issue where the button remained in a loading state indefinitely due to incorrect dependency on the `isSubmitted` state from `react-hook-form`.
