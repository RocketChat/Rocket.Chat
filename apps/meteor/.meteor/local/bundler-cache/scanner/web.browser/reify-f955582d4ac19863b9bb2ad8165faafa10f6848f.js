module.export({default:()=>flattenChildren});let Children,isValidElement,cloneElement;module.link("react",{Children(v){Children=v},isValidElement(v){isValidElement=v},cloneElement(v){cloneElement=v}},0);let isFragment;module.link("react-is",{isFragment(v){isFragment=v}},1);// index.ts






function flattenChildren(children, depth = 0, keys = []) {
  return Children.toArray(children).reduce(
    (acc, node, nodeIndex) => {
      if (isFragment(node)) {
        acc.push.apply(
          acc,
          flattenChildren(
            node.props.children,
            depth + 1,
            keys.concat(node.key || nodeIndex)
          )
        );
      } else {
        if (isValidElement(node)) {
          acc.push(
            cloneElement(node, {
              key: keys.concat(String(node.key)).join(".")
            })
          );
        } else if (typeof node === "string" || typeof node === "number") {
          acc.push(node);
        }
      }
      return acc;
    },
    []
  );
}



