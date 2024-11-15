module.export({default:()=>union});let InternSet;module.link("internmap",{InternSet(v){InternSet=v}},0);

function union(...others) {
  const set = new InternSet();
  for (const other of others) {
    for (const o of other) {
      set.add(o);
    }
  }
  return set;
}
