var presenceId;
var boardId;
var element;
var picture;

Area.Presences = {

	init: function (_roomId, _boardId, _element, _picture) {
		boardId = _boardId;
		element = _element;
		picture = _picture;
		presenceId = null;
		_.bind(findPresenceId, {roomId: _roomId})();
	},

	update: _.throttle(function (event) { /// can be _.throttle to send update every x seconds, debounce to update when inputstops
		if (!presenceId) return;
		var vec = PaintChat.getRelativeCoords(event, element);
		picture.pictureTransform.inverseTransform(vec);


		Presences.update(presenceId, {
			$set: {
				boardId: boardId,
				x: vec.x,
				y: vec.y,
			}
		});
	}, 50),

	close: function (context) {
		observer.stop();
		element = null;
		picture = null;
		Presences.update(presenceId, {
			$unset: {
				boardId: true,
				x: true,
				y: true,
			}
		});
	},

};

var findPresenceId = function () {
	var presence = Presences.findOne({
		roomId: this.roomId,
		userId: Meteor.userId(),
	});

	if (presence) {
		presenceId = presence._id;
	} else {
		setTimeout(_.bind(findPresenceId, this), 1000);
	}
};


/*
 var getRelativeCoords = function getRelativeCoords(event, element) {
 var rect = element.getBoundingClientRect();
 // + 0.5 to move to pixel center
 if (event.touches !== undefined && event.touches.length > 0) {
 return new Vec2(event.touches[0].clientX - rect.left + 0.5,
 event.touches[0].clientY - rect.top + 0.5);
 }
 return new Vec2(event.clientX - rect.left + 0.5,
 event.clientY - rect.top + 0.5);
 };
 */
