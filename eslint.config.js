// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // src/v2 is Myspace v2's data layer + screens, ported as-is (v2 had no ESLint). It trips the
    // newer React-hooks rules in hundreds of places; lint it separately before refactoring it.
    ignores: ['dist/*', 'src/v2/**'],
  },
]);
