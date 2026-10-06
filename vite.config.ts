import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite-plus'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
)

export default defineConfig({
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
    },
    environment: 'happy-dom',
  },
  lint: {
    plugins: ['import', 'typescript', 'unicorn', 'vitest'],
    categories: {
      correctness: 'error',
    },
    env: {
      builtin: true,
      browser: true,
      es2024: true,
    },
    rules: {
      // #region ESLint Recommended (Excepts correctness category)
      'getter-return': 'error',
      'no-case-declarations': 'error',
      'no-empty': 'error',
      'no-fallthrough': 'error',
      'no-misleading-character-class': 'error',
      'no-prototype-builtins': 'error',
      'no-redeclare': 'error',
      'no-regex-spaces': 'error',
      // "no-undef": "error", - disable because of Nuxt auto-imports
      'no-unexpected-multiline': 'error',
      'no-unreachable': 'error',
      // #endregion ESLint Recommended (Excepts correctness category)
      // #region typescript-eslint Recommended Type Checked (Excepts correctness category)
      // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/eslintrc/recommended-type-checked.ts
      'typescript/ban-ts-comment': 'error',
      'no-array-constructor': 'error',
      'typescript/no-empty-object-type': 'error',
      'typescript/no-explicit-any': 'error',
      'typescript/no-misused-promises': 'error',
      'typescript/no-namespace': 'error',
      'typescript/no-require-imports': 'error',
      'typescript/no-unnecessary-type-assertion': 'error',
      'typescript/no-unnecessary-type-constraint': 'error',
      'typescript/no-unsafe-argument': 'error',
      'typescript/no-unsafe-assignment': 'error',
      'typescript/no-unsafe-call': 'error',
      'typescript/no-unsafe-enum-comparison': 'error',
      'typescript/no-unsafe-function-type': 'error',
      'typescript/no-unsafe-member-access': 'error',
      'typescript/no-unsafe-return': 'error',
      'no-throw-literal': 'off',
      'typescript/only-throw-error': 'error',
      'typescript/prefer-namespace-keyword': 'error',
      'prefer-promise-reject-errors': 'off',
      'typescript/prefer-promise-reject-errors': 'error',
      'require-await': 'off',
      'typescript/require-await': 'error',
      'typescript/restrict-plus-operands': 'error',
      // #endregion typescript-eslint Recommended Type Checked (Excepts correctness category)
      // #region typescript-eslint Stylistic Type Checked (Excepts correctness category)
      // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/eslintrc/stylistic-type-checked.ts
      'typescript/adjacent-overload-signatures': 'error',
      'typescript/array-type': 'error',
      'typescript/ban-tslint-comment': 'error',
      // "@typescript-eslint/class-literal-property-style": "error",
      'typescript/consistent-generic-constructors': 'error',
      'typescript/consistent-indexed-object-style': 'error',
      // "@typescript-eslint/consistent-type-assertions": "error",
      'typescript/consistent-type-definitions': 'error',
      // "@typescript-eslint/dot-notation": "error",
      'typescript/no-confusing-non-null-assertion': 'error',
      'no-empty-function': 'error',
      'typescript/no-inferrable-types': 'error',
      'typescript/non-nullable-type-assertion-style': 'error',
      // "@typescript-eslint/prefer-find": "error",
      'typescript/prefer-for-of': 'error',
      'typescript/prefer-function-type': 'error',
      'typescript/prefer-includes': 'error',
      'typescript/prefer-nullish-coalescing': 'error',
      'typescript/prefer-optional-chain': 'error',
      // "@typescript-eslint/prefer-regexp-exec": "error",
      // "@typescript-eslint/prefer-string-starts-ends-with": "error"
      // #endregion typescript-eslint Stylistic Type Checked (Excepts correctness category)
    },
  },
  fmt: {
    arrowParens: 'avoid',
    semi: false,
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 80,
    ignorePatterns: ['*.md'],
    sortImports: {
      groups: [
        ['type-import', 'value-builtin', 'value-external'],
        ['type-internal', 'value-internal'],
        ['type-parent', 'type-sibling', 'type-index'],
        ['value-parent', 'value-sibling', 'value-index'],
        'unknown',
      ],
    },
    embeddedLanguageFormatting: 'auto',
  },
})
