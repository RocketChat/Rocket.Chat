---
'@rocket.chat/ui-composer': patch
---

`MessageFooterCallout` spaces its children with an 8px gap instead of margins on `MessageComposerIcon`, `MessageFooterCalloutContent`, `MessageFooterCalloutDivider` and `MessageFooterCalloutAction`, so the action button now sits flush with the callout padding.
