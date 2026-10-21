import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ISecurityClearance, ISecurityLabel, SecurityCategory } from '@rocket.chat/core-typings';

import { parseSpif } from '../policy/parseSpif';

export const exerciseSpif = readFileSync(join(__dirname, 'exercise-policy.xml'), 'utf8');

export const exercisePolicy = parseSpif(exerciseSpif);

export const POLICY_ID = '2.999.1';

export const UNMARKED = 0;
export const UNCLASSIFIED = 1;
export const RESTRICTED = 2;
export const CONFIDENTIAL = 3;
export const SECRET = 4;
export const TOP_SECRET = 5;

export const ATOMAL: SecurityCategory = { tagSetId: '2.999.1.1', tagType: 'restrictive', lacv: '1' };
export const CRYPTO: SecurityCategory = { tagSetId: '2.999.1.1', tagType: 'restrictive', lacv: '2' };
export const BOHEMIA: SecurityCategory = { tagSetId: '2.999.1.1', tagType: 'restrictive', lacv: '9' };
export const REL_GBR: SecurityCategory = { tagSetId: '2.999.1.2', tagType: 'permissive', lacv: '826' };
export const REL_USA: SecurityCategory = { tagSetId: '2.999.1.2', tagType: 'permissive', lacv: '840' };
export const REL_FRA: SecurityCategory = { tagSetId: '2.999.1.2', tagType: 'permissive', lacv: '250' };
export const EXERCISE: SecurityCategory = { tagSetId: '2.999.1.3', tagType: 'enumeratedPermissive', lacv: '1' };
export const OPERATION: SecurityCategory = { tagSetId: '2.999.1.3', tagType: 'enumeratedPermissive', lacv: '2' };
export const KFOR: SecurityCategory = { tagSetId: '2.999.1.4', tagType: 'permissive', lacv: '1' };
export const ORCON: SecurityCategory = { tagSetId: '2.999.1.3', tagType: 'informative', lacv: '1' };

export const label = (classification: number, ...categories: SecurityCategory[]): ISecurityLabel => ({
	policyId: POLICY_ID,
	classification,
	categories,
});

export const clearance = (classifications: number[], ...categories: SecurityCategory[]): ISecurityClearance => ({
	policyId: POLICY_ID,
	classifications,
	categories,
});
