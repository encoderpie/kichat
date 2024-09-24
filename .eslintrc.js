module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    indent: ['error', 4],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'never'], // Noktalı virgül kullanımını engeller
    'no-unexpected-multiline': 'error', // Noktalı virgül olmadığında oluşabilecek hataları önler
    'prettier/prettier': 'error',
  },
}
