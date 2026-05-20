// @ts-check
import base from './base.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...base,
  {
    rules: {
      // NestJS controllers use decorators heavily; relax some rules.
      '@typescript-eslint/no-extraneous-class': 'off',
      // Allow private constructors with DI
      '@typescript-eslint/no-unused-vars': 'off',
      // No raw Prisma $queryRawUnsafe outside of migrations
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='$queryRawUnsafe']",
          message: '$queryRawUnsafe is forbidden. Use parameterised $queryRaw or Prisma methods.',
        },
        {
          selector: "CallExpression[callee.name='parseFloat']",
          message: 'parseFloat is forbidden for money. Use Money.fromString().',
        },
      ],
    },
  },
];
