Template.account.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});
});
