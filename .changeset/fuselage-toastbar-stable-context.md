---
'@rocket.chat/fuselage-toastbar': patch
---

Fixed `ToastBarProvider` re-rendering every `useToastBarDispatch` and `useToastBarDismiss` consumer whenever a toast was shown or dismissed. The context value now stays the same for the provider's lifetime.
