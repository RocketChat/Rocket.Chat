import AleaRandomGenerator from './AleaRandomGenerator'
import createAleaGeneratorWithGeneratedSeed from './createAleaGenerator';

export default function createRandom(generator) {
  // Create a non-cryptographically secure PRNG with a given seed (using
  // the Alea algorithm)
  generator.createWithSeeds = (...seeds) => {
    if (seeds.length === 0) {
      throw new Error('No seeds were provided');
    }
    return new AleaRandomGenerator({ seeds });
  };

  // Used like `Random`, but much faster and not cryptographically
  // secure
  generator.insecure = createAleaGeneratorWithGeneratedSeed();

  return generator;
}
