/* globals Importer */
// Class for all the selection of users and channels for the importers
Importer.Selection = (Importer.Selection = class Selection {
	// Constructs a new importer selection object.
	//
	// @param [String] name the name of the Importer
	// @param [Array<Importer.User>] users the array of users
	// @param [Array<Importer.Channel>] channels the array of channels
	//
	constructor(name, users, channels) {
		this.name = name;
		this.users = users;
		this.channels = channels;
	}
});
