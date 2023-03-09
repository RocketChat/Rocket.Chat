# random
[Source code of released version](https://github.com/meteor/meteor/tree/master/packages/random) | [Source code of development version](https://github.com/meteor/meteor/tree/devel/packages/random)
***

The `random` package provides several functions for generating random
numbers. It uses a cryptographically strong pseudorandom number generator when
possible, but falls back to a weaker random number generator when
cryptographically strong randomness is not available (on older browsers or on
servers that don't have enough entropy to seed the cryptographically strong
generator).

- `Random.id([n])` - Returns a unique identifier, such as `"Jjwjg6gouWLXhMGKW"`, that is
likely to be unique in the whole world. The optional argument `n`
specifies the length of the identifier in characters and defaults to 17.

- `Random.secret([n])` - Returns a random string of printable characters with 6 bits of
entropy per character. The optional argument `n` specifies the length of
the secret string and defaults to 43 characters, or 256 bits of
entropy. Use `Random.secret` for security-critical secrets that are
intended for machine, rather than human, consumption.

- `Random.fraction()` - Returns a number between 0 and 1, like `Math.random`.

- `Random.choice(arrayOrString)` - Returns a random element of the given array or string.

- `Random.hexString(n)` - Returns a random string of `n` hexadecimal digits.