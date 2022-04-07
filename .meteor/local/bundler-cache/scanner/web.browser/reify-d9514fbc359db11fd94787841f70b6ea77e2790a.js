module.export({default:()=>identity});// Keep the identity function around for default iteratees.
function identity(value) {
  return value;
}
