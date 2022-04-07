module.export({default:()=>groupSort});let ascending;module.link("./ascending.js",{default(v){ascending=v}},0);let group,rollup;module.link("./group.js",{default(v){group=v},rollup(v){rollup=v}},1);let sort;module.link("./sort.js",{default(v){sort=v}},2);



function groupSort(values, reduce, key) {
  return (reduce.length === 1
    ? sort(rollup(values, reduce, key), (([ak, av], [bk, bv]) => ascending(av, bv) || ascending(ak, bk)))
    : sort(group(values, key), (([ak, av], [bk, bv]) => reduce(av, bv) || ascending(ak, bk))))
    .map(([key]) => key);
}
