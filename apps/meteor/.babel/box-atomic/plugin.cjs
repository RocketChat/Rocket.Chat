/**
 * PoC Babel plugin: build-time atomic extraction for <Box>.
 *
 * For every <Box> whose styling props are static literals, resolve them to
 * atomic class names at build time, strip the props, and add a plain
 * `className`. Non-literal props (expressions) are left untouched and handled
 * by the runtime atomic path.
 *
 * The resolved CSS rules are surfaced two ways:
 *   options.sheet  : Map<className, css>  — collected out-of-band (tests/demo)
 *   options.inject : boolean              — when true, each file gets a top-of-
 *                    module `attachRules("<its rules>")` call, so the CSS lands
 *                    in the page at module load with no external asset. Sharing
 *                    across files is deduped/ref-counted by attachRules.
 *
 * Resolution defaults to the bundled snapshot of Fuselage's real runtime
 * resolver (resolver.generated.cjs) so the plugin is drop-in: a consumer adds
 * just this plugin, no wiring. Both can be overridden via options for tests:
 *   options.styleProps : string[]  — recognised styling prop names
 *   options.resolve    : (props) => { className, css }[]
 */
// Lazily loaded so requiring the plugin never fails if the snapshot is absent
// (e.g. before the first esbuild bundle); only needed when resolve is omitted.
let bundled;
const getBundled = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  if (!bundled) bundled = require('./resolver.generated.cjs');
  return bundled;
};

// CANARY (temporary): fires when Meteor merely REQUIRES this module (before any
// transform), proving resolution independent of the babel cache.
try {
  require('fs').appendFileSync(
    '/tmp/box-atomic-canary.log',
    `[${process.pid}] module required ${new Date().toISOString()}\n`,
  );
} catch (_) {}

module.exports = function boxAtomicPlugin({ types: t }) {
  // CANARY (temporary): proves Meteor loads this plugin, and counts compiled
  // <Box> across the build. Remove after verifying.
  if (!global.__RCX_BOX_PLUGIN) {
    global.__RCX_BOX_PLUGIN = { loaded: true, boxes: 0 };
    try {
      require('fs').appendFileSync(
        '/tmp/box-atomic-canary.log',
        `[${process.pid}] plugin loaded ${new Date().toISOString()}\n`,
      );
    } catch (_) {}
    console.error('[box-atomic] plugin loaded by babel');
  }

  const staticValue = (node) => {
    if (node === null) return true; // boolean shorthand: <Box invisible />
    if (t.isStringLiteral(node)) return node.value;
    if (t.isJSXExpressionContainer(node)) {
      const { expression: e } = node;
      if (
        t.isStringLiteral(e) ||
        t.isNumericLiteral(e) ||
        t.isBooleanLiteral(e)
      )
        return e.value;
    }
    return undefined; // dynamic — leave for runtime
  };

  return {
    name: 'fuselage-box-atomic',
    pre() {
      this.rules = new Map(); // className -> css, for this file
    },
    visitor: {
      JSXOpeningElement(path, state) {
        const { sheet } = state.opts;
        // Safe default: keep props on the element (runtime skips them via the
        // marker, so the render-CPU win is preserved) because whether a prop is
        // introspected elsewhere (cloneElement, child.props.x, spread) can't be
        // proven statically. Full stripping is opt-in via keepProps:false.
        const keepProps = state.opts.keepProps !== false;
        const resolve = state.opts.resolve || getBundled().resolve;
        const styleProps = state.opts.styleProps || getBundled().styleProps;
        const propSet = new Set(styleProps);

        if (!t.isJSXIdentifier(path.node.name, { name: 'Box' })) return;

        const collected = {};
        const toRemove = [];

        for (const attr of path.node.attributes) {
          if (!t.isJSXAttribute(attr) || !t.isJSXIdentifier(attr.name))
            continue;
          if (!propSet.has(attr.name.name)) continue;

          const value = staticValue(attr.value);
          if (value === undefined) continue; // dynamic prop stays

          collected[attr.name.name] = value;
          toRemove.push(attr);
        }

        if (toRemove.length === 0) return;

        let resolved;
        try {
          resolved = resolve(collected);
        } catch (_) {
          return; // resolver failure → leave this Box to the runtime
        }
        if (!resolved || resolved.length === 0) return;

        global.__RCX_BOX_PLUGIN.boxes++; // CANARY

        const classNames = resolved.map((r) => r.className);
        for (const { className, css } of resolved) {
          if (sheet && !sheet.has(className)) sheet.set(className, css);
          if (!this.rules.has(className)) this.rules.set(className, css);
        }

        if (keepProps) {
          // Keep the props on the element so runtime introspection (e.g.
          // `child.props.bg`, spreads) still works; mark which props are
          // already compiled so the runtime skips restyling them.
          path.node.attributes.push(
            t.jsxAttribute(
              t.jsxIdentifier('data-rcx-atomic'),
              t.stringLiteral(Object.keys(collected).join(' ')),
            ),
          );
        } else {
          path.node.attributes = path.node.attributes.filter(
            (a) => !toRemove.includes(a),
          );
        }

        const classString = classNames.join(' ');
        const existing = path.node.attributes.find(
          (a) =>
            t.isJSXAttribute(a) &&
            t.isJSXIdentifier(a.name, { name: 'className' }),
        );

        if (!existing) {
          path.node.attributes.push(
            t.jsxAttribute(
              t.jsxIdentifier('className'),
              t.stringLiteral(classString),
            ),
          );
          return;
        }

        if (t.isStringLiteral(existing.value)) {
          existing.value = t.stringLiteral(
            `${classString} ${existing.value.value}`,
          );
          return;
        }

        // className is an expression: prepend our static classes
        if (t.isJSXExpressionContainer(existing.value)) {
          existing.value = t.jsxExpressionContainer(
            t.binaryExpression(
              '+',
              t.stringLiteral(`${classString} `),
              existing.value.expression,
            ),
          );
        }
      },
      Program: {
        exit(path, state) {
          if (!state.opts.inject || this.rules.size === 0) return;

          const css = [...this.rules.values()].join('\n');
          const attach = path.scope.generateUidIdentifier('rcxAttach');

          path.unshiftContainer('body', [
            t.importDeclaration(
              [t.importSpecifier(attach, t.identifier('attachRules'))],
              t.stringLiteral('@rocket.chat/css-in-js'),
            ),
            t.expressionStatement(
              t.callExpression(attach, [t.stringLiteral(css)]),
            ),
          ]);
        },
      },
    },
  };
};
