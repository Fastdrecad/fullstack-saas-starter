export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'docs', 'style', 'test', 'chore', 'perf'],
    ],
    'scope-enum': [1, 'always', ['web', 'api', 'shared', 'db', 'ci', 'docker']],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100],
  },
}
