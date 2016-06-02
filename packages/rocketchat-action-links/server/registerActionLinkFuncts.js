//Action Links namespace creation.

RocketChat.actionLinks = {
	register : function(name, funct) {
		RocketChat.actionLinks[name] = funct;
	}
};
