//Action Links namespace creation.

RocketChat.actionLinks = {
	register : function(functName, funct) {
		RocketChat.actionLinks[functName] = funct;
	}
};