import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  {
    rules: {
      // `catch (err: any)` and interop with the loosely-typed Google GenAI
      // SDK are common enough here that this stays a warning, not a build
      // failure.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@next/next/no-img-element': 'warn',
    },
  },
];

export default eslintConfig;
