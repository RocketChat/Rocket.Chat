var LRU = Npm.require('lru-cache');

Tinytest.add(
  'DocSize Cache - DocSzCache - constructor',
  function (test) {
    var cache = new DocSzCache(5, 10);
    test.instanceOf(cache.items, LRU);
    test.equal(cache.items.max, 5);
    test.equal(cache.maxValues, 10);
    test.equal(cache.cpuUsage, 0);
  }
);

Tinytest.add(
  'DocSize Cache - DocSzCache - setPcpu',
  function (test) {
    var cache = new DocSzCache(5, 10);
    cache.setPcpu(5);
    test.equal(cache.cpuUsage, 5);
  }
);

Tinytest.add(
  'DocSize Cache - DocSzCache - getKey',
  function (test) {
    var cache = new DocSzCache(5, 10);

    var hash1 = cache.getKey('c1', 'q1', 'o1');
    test.equal(typeof hash1, 'string');
    test.equal(hash1, '["c1","q1","o1"]');

    var hash2 = cache.getKey('c1', 'q2', 'o1');
    test.equal(typeof hash2, 'string');
    test.equal(hash2, '["c1","q2","o1"]');

    test.notEqual(hash1, hash2);
  }
);

Tinytest.add(
  'DocSize Cache - DocSzCache - getSize',
  function (test) {
    var cache = new DocSzCache(5, 3);
    var hash = cache.getKey('c1', 'q1', 'o1');
    var item = null;
    var size = 0;

    size = cache.getSize('c1', 'q1', 'o1', []);
    test.equal(cache.items.get(hash), undefined);
    test.equal(size, 0);

    // median of [10]
    size = cache.getSize('c1', 'q1', 'o1', [Random.id(10-2)]);
    test.notEqual(cache.items.get(hash), undefined);
    test.equal(size, 8 + 2);

    // median of [10, 30]
    item = cache.items.get(hash);
    item.updated = Date.now() - (60000 + 1000);
    size = cache.getSize('c1', 'q1', 'o1', [Random.id(30-2)]);
    test.equal(size, 20);

    // median of [10, 30, 50]
    item = cache.items.get(hash);
    item.updated = Date.now() - (60000 + 1000);
    size = cache.getSize('c1', 'q1', 'o1', [Random.id(50-2)]);
    test.equal(size, 30);

    // median of [30, 50, 70]
    item = cache.items.get(hash);
    item.updated = Date.now() - (60000 + 1000);
    size = cache.getSize('c1', 'q1', 'o1', [Random.id(70-2)]);
    test.equal(size, 50);
  }
);

Tinytest.add(
  'DocSize Cache - DocSzCache - getItemScore - zero score',
  function (test) {
    var timeError = 0.001;
    var cache = new DocSzCache(5, 10);
    var item = new DocSzCacheItem(10);
    item.values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    item.updated = Date.now();
    cache.cpuUsage = 100;

    var score = cache.getItemScore(item);
    test.isTrue(score >= 0 && score < 0 + timeError);
  }
);

Tinytest.add(
  'DocSize Cache - DocSzCache - getItemScore - by item count',
  function (test) {
    var timeError = 0.001;
    var cache = new DocSzCache(5, 10);
    var item = new DocSzCacheItem(10);
    item.values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    item.updated = Date.now();
    cache.cpuUsage = 100;

    for (var i=0; i <= 10; i++) {
      var score = cache.getItemScore(item);
      var expected = i / 10 / 3;
      test.isTrue(score >= expected && score < expected + timeError);
      item.values.pop();
    }
  }
);

Tinytest.add(
  'DocSize Cache - DocSzCache - getItemScore - by update time',
  function (test) {
    var timeError = 0.001;
    var cache = new DocSzCache(5, 10);
    var item = new DocSzCacheItem(10);
    item.values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    cache.cpuUsage = 100;

    for (var i=0; i <= 10; i++) {
      item.updated = Date.now() - i * 10000;
      var score = cache.getItemScore(item);
      var expected = i * 10000 / 60000 / 3;
      if (i > 6) {
        expected = 6 * 10000 / 60000 / 3;
      }

      test.isTrue(score >= expected && score < expected + timeError);
    }
  }
);

Tinytest.add(
  'DocSize Cache - DocSzCache - getItemScore - by cpu usage',
  function (test) {
    var timeError = 0.001;
    var cache = new DocSzCache(5, 10);
    var item = new DocSzCacheItem(10);
    item.values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    item.updated = Date.now();

    for (var i=0; i <= 10; i++) {
      cache.cpuUsage = 100 - i * 10;
      var score = cache.getItemScore(item);
      var expected = i / 10 / 3;
      test.isTrue(score >= expected && score < expected + timeError);
    }
  }
);

Tinytest.add(
  'DocSize Cache - DocSzCache - needsUpdate',
  function (test) {
    var timeError = 0.001;
    var cache = new DocSzCache(5, 10);
    var item = new DocSzCacheItem(10);
    item.values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    item.updated = Date.now();
    item.cpuUsage = 50;

    var score = 0;
    cache.getItemScore = function () {
      return score;
    };

    // start from bottom return and move to top
    // please check the function source code
    test.isFalse(cache.needsUpdate(item));

    score = 0.51;
    test.isTrue(cache.needsUpdate(item));

    score = 0;
    item.updated = Date.now() - 60001;
    test.isTrue(cache.needsUpdate(item));

    item.updated = Date.now();
    test.isFalse(cache.needsUpdate(item));

    item.values = [];
    test.isTrue(cache.needsUpdate(item));
  }
);


Tinytest.add(
  'DocSize Cache - DocSzCacheItem - constructor',
  function (test) {
    var item = new DocSzCacheItem(10);
    test.equal(item.maxValues, 10);
    test.equal(item.updated, 0);
    test.equal(item.values, []);
  }
);

Tinytest.add(
  'DocSize Cache - DocSzCacheItem - addData - normal',
  function (test) {
    var item = new DocSzCacheItem(10);
    var rand = Math.random();
    item.addData(rand);
    test.equal(item.values, [rand]);
    test.isTrue(Date.now() - item.updated < 100);
  }
);

Tinytest.add(
  'DocSize Cache - DocSzCacheItem - addData - overflow',
  function (test) {
    var item = new DocSzCacheItem(10);
    item.values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var rand = Math.random();
    item.addData(rand);
    test.equal(item.values, [2, 3, 4, 5, 6, 7, 8, 9, 10, rand]);
    test.isTrue(Date.now() - item.updated < 100);
  }
);

Tinytest.add(
  'DocSize Cache - DocSzCacheItem - getValue',
  function (test) {
    var item = new DocSzCacheItem(10);
    item.values = [2, 4, 6, 8, 1, 3, 5, 7];
    test.equal(item.getValue(), 4.5);
    item.values = [2, 4, 6, 8, 1, 3, 5, 7, 9];
    test.equal(item.getValue(), 5);
  }
);
