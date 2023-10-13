import { gql } from 'apollo-server';

export const typeDefs = gql`
  type Webhook {
    id: String!
    name: String!
    events: [String!]!
    url: String!
  }

  type Repository {
    name: String!
    size: Int!
    owner: String!
  }

  type RepositoryDetails {
    name: String!
    size: Int!
    owner: String!
    isPrivate: Boolean!
    fileCount: Int
    yamlContent: String
    activeWebhooks: [Webhook]
  }

  type Query {
    repositories: [Repository]
    repository(name: String!): RepositoryDetails
  }
`;
