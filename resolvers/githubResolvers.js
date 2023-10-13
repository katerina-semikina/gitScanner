import {
  getRepositories,
  getRepositoryDetails,
} from '../scripts/scanGithub.js';

export const githubResolvers = {
  Query: {
    repository: async (_, { name }) => {
      try {
        const repository = await getRepositoryDetails(name);

        return repository;
      } catch (error) {
        console.error('Error fetching repository details:', error);
        throw new Error('Unable to fetch the repository details.');
      }
    },
    repositories: async () => {
      try {
        const repositories = await getRepositories();

        return repositories;
      } catch (error) {
        console.error('Error fetching repositories:', error.message);
        throw new Error('Unable to fetch repositories.');
      }
    },
  },
};
