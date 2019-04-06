/**
 * This method is like `Object.assign` except that it recursively merges own and
 * inherited enumerable string keyed properties of source objects into the
 * destination object. Source properties that resolve to `undefined` results
 * in the property being removed from destination. Array and plain object properties
 * are merged recursively. Other objects and value types are overridden by
 * assignment. Source objects are applied from left to right. Subsequent
 * sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object`.
 *
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = {
 *   'a': [{ 'b': 2 }, { 'd': 4 }]
 * };
 *
 * var other = {
 *   'a': [{ 'c': 3 }, { 'e': 5 }]
 * };
 *
 * var another = {
 *   'a': [{ 'b': undefined }]
 * };
 *
 * merge(object, other, another);
 * // => { 'a': [{ 'b': undefined, 'c': 3 }, { 'd': 4, 'e': 5 }] }
*/
export const merge = function merge(destination, ...sources) {
	sources.forEach((source) => {
		for (const property in source) {
			if (typeof source[property] === 'object' && source[property] !== null) {
				destination[property] = destination[property] || {};
				merge(destination[property], source[property]);
			} else {
				destination[property] = source[property];
			}
		}
	});

	return destination;
};
