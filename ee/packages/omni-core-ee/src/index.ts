import { isDepartmentCreationAvailablePatch } from './isDepartmentCreationAvailable';
import { applyDepartmentRestrictionsPatch } from './patches/applyDepartmentRestrictions';

export function patchOmniCore(): void {
	isDepartmentCreationAvailablePatch();
	applyDepartmentRestrictionsPatch();
}

export * from './units/getUnitsFromUser';
