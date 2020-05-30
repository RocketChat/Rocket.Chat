import { Migrations } from '../../migrations';
import { Messages } from '../../../app/models';

Migrations.add({
	version: 71,
	up() {
		// Removes the reactions on messages which are the system type "rm" ;)
		Messages.find({ t: 'rm', reactions: { $exists: true, $not: { $size: 0 } } }, { t: 1 }).forEach(function(message) {
			Messages.update({ _id: message._id }, { $set: { reactions: [] } });
		});
	},
});
