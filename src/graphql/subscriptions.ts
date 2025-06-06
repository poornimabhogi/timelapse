import awsConfig from '../services/aws-config';

export const onCreateTimelapse = /* GraphQL */ `
  subscription OnCreateTimelapse {
    onCreateTimelapse {
      id
      userId
      title
      description
      mediaUrls
      type
      createdAt
      updatedAt
      status
      metadata
      user {
        id
        username
        name
        avatar
        createdAt
        updatedAt
      }
      likes
      comments {
        id
        text
        createdAt
        user {
          id
          username
          name
          avatar
        }
      }
    }
  }
`;

export const onCreateFeaturePost = /* GraphQL */ `
  subscription OnCreateFeaturePost {
    onCreateFeaturePost {
      id
      text
      mediaUrls
      likes
      comments {
        id
        text
        createdAt
        user {
          id
          username
          name
          avatar
        }
      }
      createdAt
      user {
        id
        username
        name
        avatar
      }
    }
  }
`;

export type OnCreateTimelapseSubscription = {
  onCreateTimelapse: {
    id: string;
    userId: string;
    title: string;
    description: string;
    mediaUrls: string[];
    type: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    metadata: any;
    user: {
      id: string;
      username: string;
      name: string;
      avatar: string;
      createdAt: string;
      updatedAt: string;
    };
    likes: number;
    comments: Array<{
      id: string;
      text: string;
      createdAt: string;
      user: {
        id: string;
        username: string;
        name: string;
        avatar: string;
      };
    }>;
  };
};

export type OnCreateFeaturePostSubscription = {
  onCreateFeaturePost: {
    id: string;
    text: string;
    mediaUrls: string[];
    likes: number;
    comments: Array<{
      id: string;
      text: string;
      createdAt: string;
      user: {
        id: string;
        username: string;
        name: string;
        avatar: string;
      };
    }>;
    createdAt: string;
    user: {
      id: string;
      username: string;
      name: string;
      avatar: string;
    };
  };
}; 