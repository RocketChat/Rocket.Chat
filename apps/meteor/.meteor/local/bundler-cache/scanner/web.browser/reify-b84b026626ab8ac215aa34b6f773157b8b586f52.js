let slice;module.link("./array.js",{slice(v){slice=v}},0);let constant;module.link("./constant.js",{default(v){constant=v}},1);let offsetNone;module.link("./offset/none.js",{default(v){offsetNone=v}},2);let orderNone;module.link("./order/none.js",{default(v){orderNone=v}},3);




function stackValue(d, key) {
  return d[key];
}

module.exportDefault(function() {
  var keys = constant([]),
      order = orderNone,
      offset = offsetNone,
      value = stackValue;

  function stack(data) {
    var kz = keys.apply(this, arguments),
        i,
        m = data.length,
        n = kz.length,
        sz = new Array(n),
        oz;

    for (i = 0; i < n; ++i) {
      for (var ki = kz[i], si = sz[i] = new Array(m), j = 0, sij; j < m; ++j) {
        si[j] = sij = [0, +value(data[j], ki, j, data)];
        sij.data = data[j];
      }
      si.key = ki;
    }

    for (i = 0, oz = order(sz); i < n; ++i) {
      sz[oz[i]].index = i;
    }

    offset(sz, oz);
    return sz;
  }

  stack.keys = function(_) {
    return arguments.length ? (keys = typeof _ === "function" ? _ : constant(slice.call(_)), stack) : keys;
  };

  stack.value = function(_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant(+_), stack) : value;
  };

  stack.order = function(_) {
    return arguments.length ? (order = _ == null ? orderNone : typeof _ === "function" ? _ : constant(slice.call(_)), stack) : order;
  };

  stack.offset = function(_) {
    return arguments.length ? (offset = _ == null ? offsetNone : _, stack) : offset;
  };

  return stack;
});
