module.export({default:()=>set});function set(values) {
  return values instanceof Set ? values : new Set(values);
}
