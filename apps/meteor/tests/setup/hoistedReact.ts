// A UNINTENDED LOL-ZONE: SORRY FOR THIS
// ------------+----------+-------------
//      /\O    |    _O    |      O
//       /\/   |   //|_   |     /_
//      /\     |    |     |     |\
//     /  \    |   /|     |    / |
//   LOL  LOL  |   LLOL   |  LOLLOL
// ------------+----------+-------------
// BLACK MAGIC FULL FEATURED ENABLED

// As Meteor requires a disabled hoisting of dependencies, we end up with multiple React instances,
// despite having the same version.

// eslint-disable-next-line @typescript-eslint/no-var-requires
Object.assign(require('../../node_modules/react'), require('../../../../node_modules/react'));
