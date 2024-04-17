Router.prototype.url = function () {
	// We need to remove the leading base path, or "/", as it will be inserted
	// automatically by `Meteor.absoluteUrl` as documented in:
	// http://docs.meteor.com/#/full/meteor_absoluteurl
	var completePath = this.path.apply(this, arguments);
	var basePath = this._basePath || '/';
	var pathWithoutBase = completePath.replace(new RegExp('^' + basePath), '');
	return Meteor.absoluteUrl(pathWithoutBase);
};
