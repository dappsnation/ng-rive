const { getJestProjects } = require('@nx/jest');

export default {
  projects: [
    ...getJestProjects(),
    '<rootDir>/apps/recorder',
    '<rootDir>/libs/ng-rive',
    '<rootDir>/apps/player',
    '<rootDir>/apps/playground',
    '<rootDir>/apps/icons',
  ],
};
