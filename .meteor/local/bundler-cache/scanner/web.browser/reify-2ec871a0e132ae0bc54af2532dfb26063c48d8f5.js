module.export({calculateDepthForNode:()=>calculateDepthForNode});let isHidden;module.link('../utils/element',{isHidden(v){isHidden=v}},0);
var calculateDepthForNode = function (node) {
    if (isHidden(node)) {
        return Infinity;
    }
    var depth = 0;
    var parent = node.parentNode;
    while (parent) {
        depth += 1;
        parent = parent.parentNode;
    }
    return depth;
};

