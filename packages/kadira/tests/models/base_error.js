Tinytest.add(
  'Models - BaseErrorModel - add filters - pass errors',
  function (test) {
    var model = new BaseErrorModel();
    model.addFilter(function() {
      return true;
    });
    var validated = model.applyFilters('type', 'message', {}, 'subType');
    test.equal(validated, true);
  }
);

Tinytest.add(
  'Models - BaseErrorModel - add filters - no filters',
  function (test) {
    var model = new BaseErrorModel();
    var validated = model.applyFilters('type', 'message', {}, 'subType');
    test.equal(validated, true);
  }
);

Tinytest.add(
  'Models - BaseErrorModel - add filters - fail errors',
  function (test) {
    var model = new BaseErrorModel();
    model.addFilter(function() {
      return false;
    });
    var validated = model.applyFilters('type', 'message', {}, 'subType');
    test.equal(validated, false);
  }
);

Tinytest.add(
  'Models - BaseErrorModel - add filters - multiple errors',
  function (test) {
    var model = new BaseErrorModel();
    model.addFilter(function() { return true; });
    model.addFilter(function() { return false; });

    var validated = model.applyFilters('type', 'message', {}, 'subType');
    test.equal(validated, false);
  }
);

Tinytest.add(
  'Models - BaseErrorModel - remove filters - multiple errors',
  function (test) {
    var model = new BaseErrorModel();
    var falseFilter = function() { return false; };
    model.addFilter(function() { return true; });
    model.addFilter(falseFilter);
    model.removeFilter(falseFilter);

    var validated = model.applyFilters('type', 'message', {}, 'subType');
    test.equal(validated, true);
  }
);

Tinytest.add(
  'Models - BaseErrorModel - add filters - invalid filters',
  function (test) {
    var model = new BaseErrorModel();
    try {
      model.addFilter({});
      test.fail('expect an error');
    } catch(ex) {
      
    }
  }
);

Tinytest.addAsync(
  'Models - BaseErrorModel - apply filters - get params',
  function (test, done) {
    var model = new BaseErrorModel();
    model.addFilter(function(type, message, error, subType) {
      test.equal(type, 'type');
      test.equal(subType, 'subType');
      test.equal(error, {stack: {}});
      test.equal(subType, 'subType');
      done();
    });
    model.applyFilters('type', 'message', {stack: {}}, 'subType');
  }
);

Tinytest.add(
  'Models - BaseErrorModel - apply filters - throw an error inside a filter',
  function (test) {
    var model = new BaseErrorModel();
    model.addFilter(function() {
      throw new Error("super error");
    });

    try {
      model.applyFilters();
      test.fail('we are looking for an error');
    } catch(ex) {
      test.equal(/an error thrown from a filter you've suplied/.test(ex.message), true);
    }
  }
);