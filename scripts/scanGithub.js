import { Octokit } from '@octokit/rest';
import { config } from 'dotenv';
import { getExtension, toChunks } from '../utils.js';

config();

const COUNT_FILES = process.env.COUNT_FILES === 'true';

const REPOSITORIES_TO_SCAN = process.env.REPOSITORIES_TO_SCAN.split(',');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

async function getNumberOfFiles(repo, owner) {
  try {
    const countFilesRecursively = async (contents) => {
      let fileCount = 0;

      for (const content of contents) {
        if (content.type === 'file') {
          fileCount++;
        } else if (content.type === 'dir') {
          const subContents = await octokit.repos.getContent({
            owner,
            repo,
            path: content.path,
          });
          fileCount += await countFilesRecursively(subContents.data);
        }
      }

      return fileCount;
    }

    const rootContents = await octokit.repos.getContent({
      owner,
      repo,
      path: '',
    });

    const totalFileCount = await countFilesRecursively(rootContents.data);

    return totalFileCount;
  } catch (error) {
    console.error('Error fetching number of files:', error.message);
    throw error;
  }
}

const findYamlFilePath = async (repo, owner) => {
  const findYamlFilePathRecursively = async (contents) => {
    for (const content of contents) {
      if (content.type === 'file' && getExtension(content.name) === 'yaml') {
        return content.path;
      } else if (content.type === 'dir') {
        const subContents = await octokit.repos.getContent({
          owner,
          repo,
          path: content.path,
        });

        const yamlPath = await findYamlFilePathRecursively(subContents.data);

        if (yamlPath) {
          return yamlPath;
        }
      }
    }

    return null;
  }

  const rootContents = await octokit.repos.getContent({
    owner,
    repo,
    path: '',
  });

  return await findYamlFilePathRecursively(rootContents.data);
}

async function getYAMLContent(repo, owner) {
  try {
    const path = await findYamlFilePath(repo, owner);

    if (!path) {
      return null;
    }

    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');

    return content;
  } catch (error) {
    console.error('Error fetching YAML content:', error.message);
    throw error;
  }
}

async function getWebhooks(repo, owner) {
  try {
    const response = await octokit.repos.listWebhooks({
      owner,
      repo,
    });

    const webhooks = response.data.map((webhook) => {
      return {
        id: webhook.id,
        name: webhook.name,
        events: webhook.events,
        url: webhook.config.url,
      };
    });

    return webhooks;
  } catch (error) {
    console.error('Error fetching webhooks:', error.message);
    throw error;
  }
}

const getRepository = async (owner, repo) => {
  try {
    const { data: repoInfo } = await octokit.repos.get({
      owner,
      repo,
    });

    return {
      name: repoInfo.name,
      size: repoInfo.size,
      owner: repoInfo.owner.login,
    };
  } catch (error) {
    console.error(`Error fetching repository ${repository}: ${error.message}`);
    return null;
  }
};

const getRepositoryMetadata = async (name) => {
  const response = await octokit.repos.listForAuthenticatedUser();

  return response.data.find((repo) => repo.name === name);
}

export const getRepositoryDetails = async (repo) => {
  try {
    const repositoryMetadata = await getRepositoryMetadata(repo);

    if (!repositoryMetadata) {
      throw new Error('Repository not found.');
    }

    const owner = repositoryMetadata.owner.login;

    const { data: repoInfo } = await octokit.repos.get({
      owner,
      repo,
    });

    const numFiles = COUNT_FILES ? await getNumberOfFiles(repo, owner) : 0;

    const yamlContent = await getYAMLContent(repo, owner);

    const webhooks = await getWebhooks(repo, owner);

    return {
      name: repoInfo.name,
      size: repoInfo.size,
      owner: repoInfo.owner.login,
      isPrivate: repoInfo.private,
      fileCount: numFiles,
      yamlContent: yamlContent,
      activeWebhooks: webhooks,
    };
  } catch (error) {
    console.error(`Error fetching repository details for ${repo}: ${error.message}`);
    throw error;
  }
};

export const getRepositories = async () => {
  try {
    const response = await octokit.repos.listForAuthenticatedUser();

    const chunks = toChunks(response.data.filter((repo) => REPOSITORIES_TO_SCAN.includes(repo.name)), 2);

    const repositories = [];

    for (const chunk of chunks) {
      repositories.push(...await Promise.all(
        chunk.map((repo) => getRepository(repo.owner.login, repo.name))
      ));
    }

    return repositories;
  } catch (error) {
    console.error(`Error fetching repositories: ${error.message}`);
    throw error;
  }
}
