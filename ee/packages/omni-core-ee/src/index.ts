import { isDepartmentCreationAvailablePatch } from './isDepartmentCreationAvailable.js';
import { applyDepartmentRestrictionsPatch } from './patches/applyDepartmentRestrictions.js';

export function patchOmniCore(): void {
	isDepartmentCreationAvailablePatch();
	applyDepartmentRestrictionsPatch();
}

export * from './outbound-communication/index.js';
export * from './units/getUnitsFromUser.js';
