import { ApolloServer } from 'apollo-server';
import { typeDefs } from './schema/repositorySchema.js';
import { githubResolvers as resolvers } from './resolvers/githubResolvers.js';

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server running: ${url}`);
});
