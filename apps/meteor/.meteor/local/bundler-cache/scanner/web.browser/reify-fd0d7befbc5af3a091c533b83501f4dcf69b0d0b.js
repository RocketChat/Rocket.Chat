let REGEX;module.link('./regex.js',{default(v){REGEX=v}},0);
function validate(uuid) {
    return typeof uuid === 'string' && REGEX.test(uuid);
}
module.exportDefault(validate);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdmFsaWRhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sWUFBWSxDQUFDO0FBRS9CLFNBQVMsUUFBUSxDQUFDLElBQWE7SUFDN0IsT0FBTyxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRUQsZUFBZSxRQUFRLENBQUMifQ==