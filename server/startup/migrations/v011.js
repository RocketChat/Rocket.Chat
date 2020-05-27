import { Migrations } from '../../migrations';
import { Rooms } from '../../../app/models';

Migrations.add({
	version: 11,
	up() {
		/*
		 * Set GENERAL room to be default
		 */
		Rooms.update({
			_id: 'GENERAL',
		}, {
			$set: {
				default: true,
			},
		});

		return console.log('Set GENERAL room to be default');
	},
});
