module.export({default:()=>permute});function permute(source, keys) {
  return Array.from(keys, key => source[key]);
}
