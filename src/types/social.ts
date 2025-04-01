export interface SocialFeedItem {
  id: string;
  userId: string;
  username: string;
  userAvatar: string | null;
  content: string;
  mediaUrls: string[];
  likes: number;
  comments: Array<{
    id: string;
    text: string;
    createdAt: Date;
    user: {
      id: string;
      username: string;
      name: string;
      avatar: string;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
  type: 'timelapse' | 'feature';
} 