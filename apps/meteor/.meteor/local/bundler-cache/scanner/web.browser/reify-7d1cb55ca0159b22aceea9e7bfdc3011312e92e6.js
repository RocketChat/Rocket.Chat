module.export({root:()=>root,Selection:()=>Selection});let selection_select;module.link("./select",{default(v){selection_select=v}},0);let selection_selectAll;module.link("./selectAll",{default(v){selection_selectAll=v}},1);let selection_filter;module.link("./filter",{default(v){selection_filter=v}},2);let selection_data;module.link("./data",{default(v){selection_data=v}},3);let selection_enter;module.link("./enter",{default(v){selection_enter=v}},4);let selection_exit;module.link("./exit",{default(v){selection_exit=v}},5);let selection_merge;module.link("./merge",{default(v){selection_merge=v}},6);let selection_order;module.link("./order",{default(v){selection_order=v}},7);let selection_sort;module.link("./sort",{default(v){selection_sort=v}},8);let selection_call;module.link("./call",{default(v){selection_call=v}},9);let selection_nodes;module.link("./nodes",{default(v){selection_nodes=v}},10);let selection_node;module.link("./node",{default(v){selection_node=v}},11);let selection_size;module.link("./size",{default(v){selection_size=v}},12);let selection_empty;module.link("./empty",{default(v){selection_empty=v}},13);let selection_each;module.link("./each",{default(v){selection_each=v}},14);let selection_attr;module.link("./attr",{default(v){selection_attr=v}},15);let selection_style;module.link("./style",{default(v){selection_style=v}},16);let selection_property;module.link("./property",{default(v){selection_property=v}},17);let selection_classed;module.link("./classed",{default(v){selection_classed=v}},18);let selection_text;module.link("./text",{default(v){selection_text=v}},19);let selection_html;module.link("./html",{default(v){selection_html=v}},20);let selection_raise;module.link("./raise",{default(v){selection_raise=v}},21);let selection_lower;module.link("./lower",{default(v){selection_lower=v}},22);let selection_append;module.link("./append",{default(v){selection_append=v}},23);let selection_insert;module.link("./insert",{default(v){selection_insert=v}},24);let selection_remove;module.link("./remove",{default(v){selection_remove=v}},25);let selection_datum;module.link("./datum",{default(v){selection_datum=v}},26);let selection_on;module.link("./on",{default(v){selection_on=v}},27);let selection_dispatch;module.link("./dispatch",{default(v){selection_dispatch=v}},28);





























var root = [null];

function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection([[document.documentElement]], root);
}

Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: selection_select,
  selectAll: selection_selectAll,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  merge: selection_merge,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch
};

module.exportDefault(selection);
