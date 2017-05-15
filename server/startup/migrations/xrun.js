if (RocketChat.Migrations.getVersion() !== 0) {
	RocketChat.Migrations.migrateTo('latest');
} else {
	const control = RocketChat.Migrations._getControl();
	control.version = _.last(RocketChat.Migrations._list).version;
	RocketChat.Migrations._setControl(control);
}
