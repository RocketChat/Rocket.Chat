# Fix: Incomplete Navigation Menu in Stack Button on Mobile/Tablet Views

## Issue Description

When the viewport width is reduced to 700px or less (tablet/mobile view), clicking the stack button (hamburger menu) in the navbar only displays **Home** and **Directory** navigation options, while **Marketplace** and **Display** options are missing from the menu.

### Expected Behavior

The stack menu should display all primary navigation options available in the desktop navbar:

- Home
- Directory
- Marketplace (with appropriate permissions)
- Display (with View Mode, Sort By, and Group by options)

### Actual Behavior

Only Home and Directory were visible in the collapsed stack menu, making it impossible for tablet/mobile users to access Marketplace and Display features.

## Root Cause

The `NavBarPagesStackMenu.tsx` component was only rendering Home and Directory menu items. It was missing the logic to include the Marketplace option (with permission checks) and the Display/Sort menu configuration that is shown in the desktop view.

## Solution

Modified `apps/meteor/client/navbar/NavBarPagesGroup/NavBarPagesStackMenu.tsx` to:

1. **Added Permission Checks**: Imported `usePermission` hook and added checks for `manage-apps` and `access-marketplace` permissions, matching the desktop navbar behavior.

2. **Added Marketplace Item**: Integrated the Marketplace menu item with proper permission-based rendering and navigation to `/marketplace` route.

3. **Integrated Display Menu**: Imported and integrated the `useSortMenu` hook to provide Display options (View Mode, Sort By, Group by) in a separate menu section, consistent with the desktop experience.

4. **Updated Route Detection**: Enhanced the `pressed` state to include the marketplace route for proper button state indication.

## Files Modified

- **`apps/meteor/client/navbar/NavBarPagesGroup/NavBarPagesStackMenu.tsx`**
  - Added import: `usePermission` from `@rocket.chat/ui-contexts`
  - Added import: `useSortMenu` from `./hooks/useSortMenu`
  - Added permission checks for marketplace access
  - Extended menu items to include Marketplace
  - Restructured menu as sections with Pages and Display groups
  - Updated route detection for active state

## Testing

### Steps to Reproduce the Fix:

1. Open http://localhost:3000
2. Reduce browser viewport width to 700px or less (use responsive design mode)
3. Click the stack/hamburger button in the navbar
4. Verify all options are visible:
   - ✅ Home
   - ✅ Directory
   - ✅ Marketplace (if user has permissions)
   - ✅ Display section with View Mode, Sort By, Group by

### Tested Scenarios:

- With marketplace permissions enabled
- With marketplace permissions disabled
- Navigation functionality for each menu item
- Button pressed state updates correctly based on current route

## Backward Compatibility

This change maintains full backward compatibility:

- Desktop view (non-tablet) is unaffected
- Permission-based rendering matches existing desktop behavior
- All existing functionality preserved
- No breaking changes to component APIs

## Related Components

- `NavBarPagesGroup.tsx` - Parent component that conditionally renders the stack menu
- `NavBarItemMarketPlaceMenu.tsx` - Marketplace menu component (desktop)
- `NavBarItemSort.tsx` - Display/Sort menu component (desktop)
