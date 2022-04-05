import { BaseRaw, IndexSpecification } from './BaseRaw';
import { IMention } from '../../../../definition/IMention';

export class MentionsRaw extends BaseRaw<IMention> {
	protected indexes: IndexSpecification[] = [
		{ key: { uid: 1 }, unique: true },
		{ key: { uid: 1, kind: 1 }, unique: true },
	];
}
