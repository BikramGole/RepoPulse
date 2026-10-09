export interface GitHubUserStats {
  login: string;
  name: string | null;
  avatarUrl: string;
  followers: number;
  following: number;
  publicRepos: number;
  starsReceived: number;
  forksReceived: number;
  totalContributions: number;
}

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

export async function fetchGitHubFollowingStats(
  username: string,
  token: string
): Promise<GitHubUserStats[]> {
  const allUsers: GitHubUserStats[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const query = `
      query GetFollowingAndStats($login: String!, $cursor: String) {
        user(login: $login) {
          following(first: 20, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              login
              name
              avatarUrl
              followers {
                totalCount
              }
              following {
                totalCount
              }
              repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false) {
                totalCount
                nodes {
                  stargazerCount
                  forkCount
                }
              }
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(GITHUB_GRAPHQL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        variables: { login: username, cursor },
      }),
      // Using Next.js fetch caching
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const { data, errors } = await response.json();
    
    if (errors) {
      throw new Error(`GraphQL Error: ${errors.map((e: any) => e.message).join(', ')}`);
    }

    const followingData = data.user.following;
    hasNextPage = followingData.pageInfo.hasNextPage;
    cursor = followingData.pageInfo.endCursor;

    for (const node of followingData.nodes) {
      let starsReceived = 0;
      let forksReceived = 0;
      
      for (const repo of node.repositories.nodes) {
        starsReceived += repo.stargazerCount;
        forksReceived += repo.forkCount;
      }

      allUsers.push({
        login: node.login,
        name: node.name,
        avatarUrl: node.avatarUrl,
        followers: node.followers.totalCount,
        following: node.following.totalCount,
        publicRepos: node.repositories.totalCount,
        starsReceived,
        forksReceived,
        totalContributions: node.contributionsCollection.contributionCalendar.totalContributions,
      });
    }
  }

  return allUsers;
}
