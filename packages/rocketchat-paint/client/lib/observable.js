Observable = function (value, options) {

	var dependency = new Deps.Dependency();
	// console.log("==========OB", dependency);
	options = options || {};
	var equals = options.equals || EJSON.equals;

	this.set = function (newValue) {
		if (!equals(value, newValue)) {
			value = newValue;
			dependency.changed();
		}
	};

	this.get = function () {
		dependency.depend();
		return value;
	};

	this.peek = function () {
		return value;
	};

};


ODict = function (value, options) {

	var dependency = new Deps.Dependency();
	// console.log("==========OD", dependency);
	options = options || {};
	var equals = options.equals || EJSON.equals;

	this.set = function (key, newValue) {
		if (!equals(value[key], newValue)) {
			value[key] = newValue;
			dependency.changed();
		}
	};

	this.get = function (key) {
		dependency.depend();
		if (key) return value[key];
		return value;
	};

	this.peek = function (key) {
		if (key) return value[key];
		return value;
	};

	Deps.autorun(function () {
		dependency.depend();
	});

};

