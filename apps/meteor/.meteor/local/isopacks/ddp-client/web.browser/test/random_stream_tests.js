Tinytest.addAsync('livedata - DDP.randomStream', async function(test) {
  const randomSeed = Random.id();
  const context = { randomSeed: randomSeed };

  let sequence = await DDP._CurrentMethodInvocation.withValue(context, function() {
    return DDP.randomStream('1');
  });

  let seeds = sequence.alea.args;

  test.equal(seeds.length, 2);
  test.equal(seeds[0], randomSeed);
  test.equal(seeds[1], '1');

  const id1 = sequence.id();

  // Clone the sequence by building it the same way RandomStream.get does
  const sequenceClone = Random.createWithSeeds.apply(null, seeds);
  const id1Cloned = sequenceClone.id();
  const id2Cloned = sequenceClone.id();
  test.equal(id1, id1Cloned);

  // We should get the same sequence when we use the same key
  sequence = await DDP._CurrentMethodInvocation.withValue(context, function() {
    return DDP.randomStream('1');
  });
  seeds = sequence.alea.args;
  test.equal(seeds.length, 2);
  test.equal(seeds[0], randomSeed);
  test.equal(seeds[1], '1');

  // But we should be at the 'next' position in the stream
  const id2 = sequence.id();

  // Technically these could be equal, but likely to be a bug if hit
  // http://search.dilbert.com/comic/Random%20Number%20Generator
  test.notEqual(id1, id2);

  test.equal(id2, id2Cloned);
});

Tinytest.add('livedata - DDP.randomStream with no-args', function(test) {
  DDP.randomStream().id();
});
