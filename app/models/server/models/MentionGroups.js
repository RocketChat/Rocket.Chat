import { Base } from './_Base';

export class MentionGroups extends Base {
	constructor() {
		super('mention_groups');
		this.tryEnsureIndex({ name: 1 });
	}
}

export default new MentionGroups();
