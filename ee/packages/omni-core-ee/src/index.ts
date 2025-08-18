import { applyDepartmentRestrictionsPatch } from './hooks/applyDepartmentRestrictions';
import { isDepartmentCreationAvailablePatch } from './isDepartmentCreationAvailable';

export function patchOmniCore(): void {
	isDepartmentCreationAvailablePatch();
	applyDepartmentRestrictionsPatch();
}

export * from './units/getUnitsFromUser';
