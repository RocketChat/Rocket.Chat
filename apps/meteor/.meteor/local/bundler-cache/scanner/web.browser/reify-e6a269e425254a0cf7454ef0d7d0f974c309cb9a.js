module.export({Transition:()=>Transition,default:()=>transition,newId:()=>newId});let selection;module.link("d3-selection",{selection(v){selection=v}},0);let transition_attr;module.link("./attr",{default(v){transition_attr=v}},1);let transition_attrTween;module.link("./attrTween",{default(v){transition_attrTween=v}},2);let transition_delay;module.link("./delay",{default(v){transition_delay=v}},3);let transition_duration;module.link("./duration",{default(v){transition_duration=v}},4);let transition_ease;module.link("./ease",{default(v){transition_ease=v}},5);let transition_filter;module.link("./filter",{default(v){transition_filter=v}},6);let transition_merge;module.link("./merge",{default(v){transition_merge=v}},7);let transition_on;module.link("./on",{default(v){transition_on=v}},8);let transition_remove;module.link("./remove",{default(v){transition_remove=v}},9);let transition_select;module.link("./select",{default(v){transition_select=v}},10);let transition_selectAll;module.link("./selectAll",{default(v){transition_selectAll=v}},11);let transition_selection;module.link("./selection",{default(v){transition_selection=v}},12);let transition_style;module.link("./style",{default(v){transition_style=v}},13);let transition_styleTween;module.link("./styleTween",{default(v){transition_styleTween=v}},14);let transition_text;module.link("./text",{default(v){transition_text=v}},15);let transition_transition;module.link("./transition",{default(v){transition_transition=v}},16);let transition_tween;module.link("./tween",{default(v){transition_tween=v}},17);


















var id = 0;

function Transition(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function transition(name) {
  return selection().transition(name);
}

function newId() {
  return ++id;
}

var selection_prototype = selection.prototype;

Transition.prototype = transition.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease
};
