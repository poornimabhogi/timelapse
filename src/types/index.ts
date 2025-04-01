export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  following: string[];
  followers: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelapseItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  mediaUrls: string[];
  type: 'image' | 'video';
  createdAt: string;
  updatedAt: string;
  status: 'processing' | 'completed' | 'failed';
  metadata?: {
    duration?: number;
    frameCount?: number;
    fps?: number;
  };
}

export interface SocialFeedItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  mediaUrls: string[];
  type: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  metadata?: any;
  likes: number;
  comments: number;
  user: User;
} 