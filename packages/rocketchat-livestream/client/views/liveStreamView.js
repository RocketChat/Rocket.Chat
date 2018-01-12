Template.liveStreamView.events({
	'click .streaming-object'(e) {
		e.stopPropagation();
		console.log('clicked video');
	},
	'click .youtube-player'(e) {
		e.stopPropagation();
		e.preventDefault();
		console.log('youtube player ');
	}
});
