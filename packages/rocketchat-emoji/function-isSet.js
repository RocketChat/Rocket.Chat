/* globals isSet:true, isSetNotNull:true */
//http://stackoverflow.com/a/26990347 function isSet() from Gajus
isSet = function(fn) {
	var value;
	try {
		value = fn();
	} catch (e) {
		value = undefined;
	} finally {
		return value !== undefined;
	}
};

isSetNotNull = function(fn) {
	var value;
	try {
		value = fn();
	} catch (e) {
		value = null;
	} finally {
		return value !== null && value !== undefined;
	}
};

/* exported isSet, isSetNotNull */
