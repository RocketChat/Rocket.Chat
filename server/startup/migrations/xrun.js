import _ from 'underscore';

if (RocketChat.Migrations.getVersion() !== 0) {
	RocketChat.Migrations.migrateTo(process.env.MIGRATION_VERSION || 'latest');
} else {
	const control = RocketChat.Migrations._getControl();
	control.version = _.last(RocketChat.Migrations._list).version;
	RocketChat.Migrations._setControl(control);
}
