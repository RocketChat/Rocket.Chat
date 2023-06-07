---
"@rocket.chat/web-ui-registration": patch
---

fix: Incomplete emails are being accepted at user registration

✅ Added a new email validation layer to the useForm hook in the `packages/web-ui-registration/src/RegisterForm.tsx` file
