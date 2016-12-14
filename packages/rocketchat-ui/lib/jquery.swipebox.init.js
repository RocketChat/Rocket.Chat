Meteor.startup(function() {
	$('.swipebox').swipebox({
		hideBarsDelay: 0
	});
	$(document).on('click', '#swipebox-overlay', function() {
		$.swipebox.close();
	});
});
