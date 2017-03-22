/* exported _dbs */
_dbs = {
	unique: function(arrayArgument){
		return arrayArgument.filter((elem, pos, arr) => {
			return arr.indexOf(elem) == pos;
		});
	}
};
