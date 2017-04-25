Template.account.onRendered(function() {
	return Tracker.afterFlush(function() {
		SideNav.setFlex('accountFlex');
		return SideNav.openFlex();
	});
});
