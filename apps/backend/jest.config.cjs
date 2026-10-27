module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  moduleNameMapper: {
    "^@the-governor/shared$": "<rootDir>/../../packages/shared/src/index.ts"
  }
};