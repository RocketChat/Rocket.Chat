Tinytest.add(
  'Ntp - ._now - with correct Date.now',
  function (test) {
    var now = Ntp._now();
    test.equal(now > 0, true);
    test.equal(typeof now, 'number');
  }
);

Tinytest.add(
  'Ntp - ._now - with Date.now as Date object',
  function (test) {
    var oldDateNow = Date.now;
    Date.now = function() {
      return new Date();
    };

    test.equal(typeof Date.now().getTime(), 'number');
    var now = Ntp._now();
    test.equal(now > 0, true);
    test.equal(typeof now, 'number');

    Date.now = oldDateNow;
  }
);
