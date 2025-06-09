import awsConfig from "../services/aws-config";

export const listTimelapses = /* GraphQL */ `
  query ListTimelapses($limit: Int) {
    listTimelapses(limit: $limit) {
      items {
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
      nextToken
    }
  }
`;

export const getFeaturePosts = /* GraphQL */ `
  query GetFeaturePosts {
    getFeaturePosts {
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

export type ListTimelapsesQuery = {
  listTimelapses: {
    items: Array<{
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
    }>;
    nextToken: string | null;
  };
};

export type GetFeaturePostsQuery = {
  getFeaturePosts: Array<{
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
  }>;
};

// Product-related queries for marketplace
export const getAllProducts = /* GraphQL */ `
  query GetAllProducts($limit: Int, $nextToken: String) {
    getAllProducts(limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        description
        price
        images
        category
        sellerId
        createdAt
        updatedAt
        isActive
        inventory
      }
      nextToken
    }
  }
`;

export const getVerifiedSellersProducts = /* GraphQL */ `
  query GetVerifiedSellersProducts($limit: Int, $nextToken: String) {
    getVerifiedSellersProducts(limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        description
        price
        images
        category
        sellerId
        sellerName
        sellerVerified
        businessName
        createdAt
        updatedAt
        isActive
        inventory
      }
      nextToken
    }
  }
`;

export const getSellerDetails = /* GraphQL */ `
  query GetSellerDetails($sellerId: ID!) {
    getSellerDetails(sellerId: $sellerId) {
      id
      name
      email
      verified
      businessName
      businessType
      status
    }
  }
`;

export const getUserProducts = /* GraphQL */ `
  query GetUserProducts($sellerId: ID!) {
    getUserProducts(sellerId: $sellerId) {
      id
      name
      description
      price
      images
      category
      sellerId
      createdAt
      updatedAt
      isActive
      inventory
    }
  }
`;

export const getSellerVerification = /* GraphQL */ `
  query GetSellerVerification($userId: ID!) {
    getSellerVerification(userId: $userId) {
      id
      userId
      businessName
      businessType
      status
      createdAt
      updatedAt
    }
  }
`;

// Type definitions for the new queries
export type GetAllProductsQuery = {
  getAllProducts: {
    items: Array<{
      id: string;
      name: string;
      description: string;
      price: number;
      images: string[];
      category: string;
      sellerId: string;
      createdAt: string;
      updatedAt: string;
      isActive: boolean;
      inventory: number;
    }>;
    nextToken: string | null;
  };
};

export type GetVerifiedSellersProductsQuery = {
  getVerifiedSellersProducts: {
    items: Array<{
      id: string;
      name: string;
      description: string;
      price: number;
      images: string[];
      category: string;
      sellerId: string;
      sellerName: string;
      sellerVerified: boolean;
      businessName: string;
      createdAt: string;
      updatedAt: string;
      isActive: boolean;
      inventory: number;
    }>;
    nextToken: string | null;
  };
};

export type GetSellerDetailsQuery = {
  getSellerDetails: {
    id: string;
    name: string;
    email: string;
    verified: boolean;
    businessName: string;
    businessType: string;
    status: string;
  };
};

export type GetUserProductsQuery = {
  getUserProducts: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    sellerId: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    inventory: number;
  }>;
};

export type GetSellerVerificationQuery = {
  getSellerVerification: {
    id: string;
    userId: string;
    businessName: string;
    businessType: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
};

// Product mutations
export const createProduct = /* GraphQL */ `
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      price
      images
      category
      sellerId
      createdAt
      updatedAt
      isActive
      inventory
    }
  }
`;

export const updateProduct = /* GraphQL */ `
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      name
      description
      price
      images
      category
      sellerId
      createdAt
      updatedAt
      isActive
      inventory
    }
  }
`;

export const deleteProduct = /* GraphQL */ `
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

// Mutation type definitions
export type CreateProductMutation = {
  createProduct: {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    sellerId: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    inventory: number;
  };
};

export type UpdateProductMutation = {
  updateProduct: {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    sellerId: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    inventory: number;
  };
};

export type DeleteProductMutation = {
  deleteProduct: boolean;
};

// Product subscriptions for real-time updates
export const onCreateProduct = /* GraphQL */ `
  subscription OnCreateProduct {
    onCreateProduct {
      id
      name
      description
      price
      images
      category
      sellerId
      createdAt
      updatedAt
      isActive
      inventory
    }
  }
`;

export const onUpdateProduct = /* GraphQL */ `
  subscription OnUpdateProduct($id: ID) {
    onUpdateProduct(id: $id) {
      id
      name
      description
      price
      images
      category
      sellerId
      createdAt
      updatedAt
      isActive
      inventory
    }
  }
`;

export const onDeleteProduct = /* GraphQL */ `
  subscription OnDeleteProduct($id: ID) {
    onDeleteProduct(id: $id) {
      id
      name
      category
      sellerId
    }
  }
`;

export const onProductsByCategory = /* GraphQL */ `
  subscription OnProductsByCategory($category: String!) {
    onProductsByCategory(category: $category) {
      id
      name
      description
      price
      images
      category
      sellerId
      createdAt
      updatedAt
      isActive
      inventory
    }
  }
`;

export const onSellerProducts = /* GraphQL */ `
  subscription OnSellerProducts($sellerId: ID!) {
    onSellerProducts(sellerId: $sellerId) {
      id
      name
      description
      price
      images
      category
      sellerId
      createdAt
      updatedAt
      isActive
      inventory
    }
  }
`;

export const onInventoryUpdate = /* GraphQL */ `
  subscription OnInventoryUpdate($productId: ID) {
    onInventoryUpdate(productId: $productId) {
      productId
      oldInventory
      newInventory
      change
      reason
      timestamp
      sellerId
    }
  }
`;

// Following-based subscriptions for personalized updates
export const onFollowedSellerProducts = /* GraphQL */ `
  subscription OnFollowedSellerProducts($followerId: ID!) {
    onFollowedSellerProducts(followerId: $followerId) {
      id
      name
      description
      price
      images
      category
      sellerId
      createdAt
      updatedAt
      isActive
      inventory
    }
  }
`;

export const onFollowedSellerInventory = /* GraphQL */ `
  subscription OnFollowedSellerInventory($followerId: ID!) {
    onFollowedSellerInventory(followerId: $followerId) {
      productId
      oldInventory
      newInventory
      change
      reason
      timestamp
      sellerId
    }
  }
`;

// Inventory update mutation
export const updateProductInventory = /* GraphQL */ `
  mutation UpdateProductInventory($input: UpdateInventoryInput!) {
    updateProductInventory(input: $input) {
      productId
      oldInventory
      newInventory
      change
      reason
      timestamp
      sellerId
    }
  }
`;

// Subscription type definitions
export type OnCreateProductSubscription = {
  onCreateProduct: {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    sellerId: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    inventory: number;
  };
};

export type OnUpdateProductSubscription = {
  onUpdateProduct: {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    sellerId: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    inventory: number;
  };
};

export type OnDeleteProductSubscription = {
  onDeleteProduct: {
    id: string;
    name: string;
    category: string;
    sellerId: string;
  };
};

export type OnInventoryUpdateSubscription = {
  onInventoryUpdate: {
    productId: string;
    oldInventory: number;
    newInventory: number;
    change: number;
    reason: string;
    timestamp: string;
    sellerId: string;
  };
};

export type UpdateInventoryMutation = {
  updateProductInventory: {
    productId: string;
    oldInventory: number;
    newInventory: number;
    change: number;
    reason: string;
    timestamp: string;
    sellerId: string;
  };
};

// Following management queries
export const followUser = /* GraphQL */ `
  mutation FollowUser($followerId: ID!, $followingId: ID!) {
    followUser(followerId: $followerId, followingId: $followingId) {
      id
      follower {
        id
        username
      }
      following {
        id
        username
      }
      createdAt
    }
  }
`;

export const unfollowUser = /* GraphQL */ `
  mutation UnfollowUser($followerId: ID!, $followingId: ID!) {
    unfollowUser(followerId: $followerId, followingId: $followingId)
  }
`;

export const getFollowedSellers = /* GraphQL */ `
  query GetFollowedSellers($userId: ID!) {
    getFollowedSellers(userId: $userId) {
      id
      username
      name
      bio
      avatar
    }
  }
`;

export const isFollowing = /* GraphQL */ `
  query IsFollowing($followerId: ID!, $followingId: ID!) {
    isFollowing(followerId: $followerId, followingId: $followingId)
  }
`;

export const getFollowedSellerProducts = /* GraphQL */ `
  query GetFollowedSellerProducts($userId: ID!, $limit: Int, $nextToken: String) {
    getFollowedSellerProducts(userId: $userId, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        description
        price
        images
        category
        sellerId
        createdAt
        updatedAt
        isActive
        inventory
      }
      nextToken
    }
  }
`;

// Type definitions for following-based subscriptions
export type OnFollowedSellerProductsSubscription = {
  onFollowedSellerProducts: {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    sellerId: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    inventory: number;
  };
};

export type OnFollowedSellerInventorySubscription = {
  onFollowedSellerInventory: {
    productId: string;
    oldInventory: number;
    newInventory: number;
    change: number;
    reason: string;
    timestamp: string;
    sellerId: string;
  };
};

export type FollowUserMutation = {
  followUser: {
    id: string;
    follower: {
      id: string;
      username: string;
    };
    following: {
      id: string;
      username: string;
    };
    createdAt: string;
  };
};

export type UnfollowUserMutation = {
  unfollowUser: boolean;
};

export type GetFollowedSellersQuery = {
  getFollowedSellers: Array<{
    id: string;
    username: string;
    name: string;
    bio: string;
    avatar: string;
  }>;
};

export type IsFollowingQuery = {
  isFollowing: boolean;
}; 