---
"@rocket.chat/meteor": patch
---

chore: break down helpers.ts and create new files

🔀 changed `handleAPIError` import in AppDetailsPage.tsx
🔀 changed `apiCurlGetter` import in AppDetailsAPIs.tsx
🔀 changed `formatPriceAndPurchaseType` import in AppStatusPriceDisplay.tsx

❌ deleted `apiCurlGetter, handleInstallError, handleAPIError, warnAppInstall, warnEnableDisableApp, warnStatusChange, formatPriceAndPurchaseType` and moved them to new files, from helpers.ts

✅ created apiCurlGetter.ts file
✅ created appErroredStatuses.ts file
✅ created formatPrice.ts file
✅ created formatPriceAndPurchaseType.ts file
✅ created formatPricingPlan.ts file
✅ created handleAPIError.ts file
✅ created handleInstallError.ts file
✅ created installApp.ts file
✅ created updateApp.ts file
✅ created warnAppInstal.ts file
✅ created warnEnableDisableApp.ts file
✅ created warnStatusChange.ts file

🔀 changed `handleAPIError` import in useAppInstallationHandler.tsx
🔀 changed `handleAPIError` import in useCategories.ts
🔀 changed `handleAPIError` import in useOpenIncompatibleModal.tsx

