export { canAccess, clearanceForPolicy } from './accessControl';
export { accessRequirement, meetsRequirement, readerAccess } from './accessRequirement';
export { buildCatalog, defaultCatalogEntries } from './catalog';
export { dominates } from './dominance';
export type { CatalogEntry } from './catalog';
export { SpifError, UnknownPolicyError } from './errors';
export { displayMarking } from './marking/displayMarking';
export type { DisplayMarkingOptions } from './marking/displayMarking';
export { parseSpif, SPIF_NAMESPACE } from './policy/parseSpif';
export { PolicyRegistry } from './policy/PolicyRegistry';
export { categoryKey } from './policy/types';
export type {
	CategoryRequirement,
	Marking,
	MarkingLocation,
	MarkingPhrase,
	Markings,
	SecurityCategoryDefinition,
	SecurityCategoryTagDefinition,
	SecurityCategoryTagSetDefinition,
	SecurityClassificationDefinition,
	SecurityPolicy,
} from './policy/types';
export { validateLabel } from './validateLabel';
export type { LabelViolation } from './validateLabel';
