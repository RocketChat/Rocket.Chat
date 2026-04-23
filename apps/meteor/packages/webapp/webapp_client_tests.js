// Regression test for #3730
Tinytest.add("webapp - runtime config", function (test) {
  test.equal(__meteor_runtime_config__.WEBAPP_TEST_A, '<p>foo</p>');
  test.equal(__meteor_runtime_config__.WEBAPP_TEST_B, '</script>');
});
