module.export({default:()=>intersection});let InternSet;module.link("internmap",{InternSet(v){InternSet=v}},0);

function intersection(values, ...others) {
  values = new InternSet(values);
  others = others.map(set);
  out: for (const value of values) {
    for (const other of others) {
      if (!other.has(value)) {
        values.delete(value);
        continue out;
      }
    }
  }
  return values;
}

function set(values) {
  return values instanceof InternSet ? values : new InternSet(values);
}
