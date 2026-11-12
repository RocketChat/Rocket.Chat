module.exports = {
	makeMediaCallWidgetInteractionContext: (interaction) => {
		if (interaction?.interactionData?.buttonContext !== 'mediaCallWidgetAction') {
			throw new Error("Object can't be made into a Media Call Widget Interaction");
		}

		return interaction;
	},
};
