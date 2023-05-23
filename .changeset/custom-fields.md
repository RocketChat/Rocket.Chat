---
"@rocket.chat/meteor": patch
"@rocket.chat/core-typings": patch
"@rocket.chat/rest-typings": patch
"@rocket.chat/ui-client": patch
"@rocket.chat/ui-contexts": patch
"@rocket.chat/web-ui-registration": patch
---

✅ Created CustomFieldForm component to `packages/ui-client`
🔀 Moved useAccountsCustomFields.ts to `packages/ui-context`
🔀 Moved CustomFieldMetadata.ts type to `packages/core-typings`
Rename omnichannel CustomFieldsForm.js to NewCustomFieldsForm.js to avoid confusion between names
✅ Add the CustomFieldForm to all places that used the old components
🎨 Styled buttons from UsersTable actions (add as blue)
❌ delete AccountsCustomFieldsAssembler
❌ delete CustomFieldV2 from omnichannel
❌ delete CustomField from meteor/components
