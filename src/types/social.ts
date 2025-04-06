export interface SocialFeedItem {
  id: string;
  userId: string;
  username: string;
  userAvatar: string | null;
  content: string;
  mediaUrls: string[];
  likes: number;
  likedBy?: string[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  type: 'timelapse' | 'post';
}

export interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
  };
} 