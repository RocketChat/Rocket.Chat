module.export({default:()=>difference});let InternSet;module.link("internmap",{InternSet(v){InternSet=v}},0);

function difference(values, ...others) {
  values = new InternSet(values);
  for (const other of others) {
    for (const value of other) {
      values.delete(value);
    }
  }
  return values;
}
