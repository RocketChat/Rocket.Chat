/**
 * Makes the knowledge base panel open on opening a room in which it is active
 * (a request, an expertise or a livechat)
 */
RocketChat.callbacks.add('enter-room', function(subscription) {
	const roomOpened = RocketChat.models.Rooms.findOne({_id: subscription.rid});
	if (roomOpened.t === 'r' || roomOpened.t === 'e' || roomOpened.t === 'l') {
		$('.flex-tab-container:not(.opened) .flex-tab-bar :not(.hidden) .icon-lightbulb').click(); //there is no ID of the tabbar's Button which we could use so far
	}
});
