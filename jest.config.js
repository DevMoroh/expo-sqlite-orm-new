module.exports = {
  transform: {
      '^.+\\.ts?$': 'ts-jest',
  },
  roots: ["<rootDir>/src/", "<rootDir>/__tests__/"],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
