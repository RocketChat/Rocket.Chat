import _ from 'underscore';
import { Migrations } from 'meteor/rocketchat:migrations';

if (Migrations.getVersion() !== 0) {
	Migrations.migrateTo(process.env.MIGRATION_VERSION || 'latest');
} else {
	const control = Migrations._getControl();
	control.version = _.last(Migrations._list).version;
	Migrations._setControl(control);
}
