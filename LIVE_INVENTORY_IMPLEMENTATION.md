# Live Inventory Updates with Subscription Client

## Overview

This implementation adds **real-time inventory management** and **live product updates** to the timelapse marketplace using AWS AppSync GraphQL subscriptions. The system provides instant notifications when products are added, updated, deleted, or when inventory levels change.

## 🎯 Key Features

### Real-Time Marketplace Updates
- **Live product additions**: New products appear instantly across all user devices
- **Inventory tracking**: Real-time stock level updates with visual indicators
- **Product modifications**: Changes to product details propagate immediately
- **Out-of-stock notifications**: Automatic alerts when items become unavailable

### Enhanced User Experience
- **Visual indicators**: Live badges, inventory status, and real-time notifications
- **Verified seller integration**: Only email-verified sellers can trigger live updates
- **Category-specific subscriptions**: Filter live updates by product category
- **Seller-specific monitoring**: Local shop owners see their own product updates

## 🏗️ Architecture

### GraphQL Subscription Schema
```graphql
# Product subscriptions for live inventory updates
onCreateProduct: Product
  @aws_subscribe(mutations: ["createProduct"])

onUpdateProduct(id: ID): Product
  @aws_subscribe(mutations: ["updateProduct"])

onDeleteProduct(id: ID): Product
  @aws_subscribe(mutations: ["deleteProduct"])

# Category-specific product updates
onProductsByCategory(category: String!): Product
  @aws_subscribe(mutations: ["createProduct", "updateProduct"])

# Seller-specific product updates for Local Shop
onSellerProducts(sellerId: ID!): Product
  @aws_subscribe(mutations: ["createProduct", "updateProduct", "deleteProduct"])

# Inventory-specific updates
onInventoryUpdate(productId: ID): InventoryUpdate
  @aws_subscribe(mutations: ["updateProductInventory"])
```

### Core Services

#### 1. **Subscription Service** (`src/services/subscriptionService.ts`)
- **Apollo Client Integration**: Uses same client for queries and subscriptions
- **Subscription Management**: Global subscription manager with cleanup
- **Multi-subscription Support**: Marketplace, seller, category, and inventory subscriptions
- **Error Handling**: Robust error handling with automatic retry logic

#### 2. **Real-Time Features**
```typescript
// Global marketplace updates
subscribeToMarketplaceUpdates(callbacks: ProductSubscriptionCallbacks)

// Seller-specific updates (Local Shop)
subscribeToSellerUpdates(sellerId: string, callbacks: ProductSubscriptionCallbacks)

// Category filtering
subscribeToCategoryUpdates(category: string, callbacks: ProductSubscriptionCallbacks)

// Inventory monitoring
monitorProductInventory(productIds: string[], onInventoryChange: Function)
```

## 🛠️ Implementation Details

### Global Shop (ShopScreen)
```typescript
// Real-time marketplace subscriptions
const callbacks: ProductSubscriptionCallbacks = {
  onProductCreated: (product) => {
    // Add new product to top of list with "NEW" badge
    setProducts(prevProducts => [newProduct, ...prevProducts]);
    Alert.alert('🆕 New Product!', `${product.name} just added to marketplace`);
  },
  
  onProductUpdated: (product) => {
    // Update existing product in real-time
    setProducts(prevProducts => 
      prevProducts.map(p => p.id === product.id ? {...p, ...product} : p)
    );
  },
  
  onInventoryChanged: (update) => {
    // Live inventory updates with visual indicators
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === update.productId ? {...p, inventory: update.newInventory} : p
      )
    );
  }
};

subscribeToMarketplaceUpdates(callbacks);
```

### Local Shop
```typescript
// Seller-specific subscriptions for personal shop management
const setupSellerSubscriptions = () => {
  const callbacks: ProductSubscriptionCallbacks = {
    onProductCreated: (product) => {
      if (product.sellerId === user.uid) {
        Alert.alert('✅ Product Added!', `${product.name} is now live in your shop`);
        setProducts(prevProducts => [product, ...prevProducts]);
      }
    },
    
    onInventoryChanged: (update) => {
      // Low stock alerts for sellers
      if (update.newInventory < 5 && update.newInventory > 0) {
        Alert.alert('⚠️ Low Stock Alert', 
          `${productName} is running low (${update.newInventory} left)`);
      }
    }
  };
  
  subscribeToSellerUpdates(user.uid, callbacks);
};
```

### Visual Indicators

#### Product Cards with Live Status
```typescript
// Real-time inventory status badges
{item.inventory !== undefined && (
  <View style={[
    styles.inventoryBadge,
    isOutOfStock ? styles.outOfStockBadge : 
    isLowStock ? styles.lowStockBadge : styles.inStockBadge
  ]}>
    <Text style={styles.inventoryText}>
      {isOutOfStock ? '❌ OUT OF STOCK' : 
       isLowStock ? `⚠️ ${item.inventory} LEFT` : '✅ IN STOCK'}
    </Text>
  </View>
)}

// Live update badges for new products
{item.isNew && (
  <View style={styles.newBadge}>
    <Text style={styles.newBadgeText}>🔴 LIVE NEW!</Text>
  </View>
)}
```

#### Live Status Indicator
```typescript
// Header live status for Local Shop
{liveUpdatesEnabled && (
  <View style={styles.liveStatusBadge}>
    <View style={styles.liveIndicator} />
    <Text style={styles.liveStatusText}>LIVE</Text>
  </View>
)}
```

## 📦 Inventory Management Component

### Real-Time Inventory Manager (`src/components/InventoryManager.tsx`)
- **Live monitoring**: Real-time inventory tracking for specific products
- **Quick actions**: Fast inventory adjustments (-5, -1, +1, +5)
- **Manual updates**: Precise inventory setting with reason tracking
- **History tracking**: Recent inventory changes with timestamps
- **Status indicators**: Visual inventory status (In Stock, Low Stock, Out of Stock)

```typescript
// Real-time inventory monitoring
const setupInventoryMonitoring = () => {
  const subscriptionKey = monitorProductInventory([product.id], (update) => {
    setCurrentInventory(update.newInventory);
    setInventoryHistory(prev => [update, ...prev].slice(0, 10));
  });
};

// Inventory update with live notification
const handleInventoryUpdate = async () => {
  const success = await updateInventory(product.id, newInventoryNumber, reason);
  if (success) {
    // Live update triggers subscription notifications to all connected clients
    onInventoryUpdate(product.id, newInventoryNumber);
  }
};
```

## 🎨 User Experience Enhancements

### Live Notifications
- **New Product Alerts**: "🆕 New Product! [Product Name] just added to marketplace"
- **Inventory Warnings**: "⚠️ Low Stock Alert: [Product] is running low (X left)"
- **Update Confirmations**: "✅ Inventory Updated! [Product] inventory updated from X to Y"

### Visual Feedback
- **Pulsing animations** for new products
- **Color-coded inventory status** (Green: In Stock, Orange: Low Stock, Red: Out of Stock)
- **Live badge indicators** showing real-time connection status
- **Disabled states** for out-of-stock products

### Category Filtering
- **Live category updates**: Real-time product additions/changes filtered by category
- **Smart notifications**: Only relevant updates based on current filter
- **Seamless transitions**: No disruption to user browsing experience

## 🔧 Technical Implementation

### Subscription Lifecycle Management
```typescript
// Global subscription manager
export const subscriptionManager: SubscriptionManager = {
  subscriptions: new Map<string, () => void>(),
  
  addSubscription(key: string, unsubscribe: () => void) {
    this.removeSubscription(key); // Prevent duplicates
    this.subscriptions.set(key, unsubscribe);
  },
  
  removeAllSubscriptions() {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
  }
};
```

### Error Handling & Reconnection
- **Automatic error recovery**: Subscriptions restart on connection issues
- **Graceful degradation**: App continues functioning without live updates
- **User feedback**: Status indicators show connection state
- **Memory management**: Automatic cleanup prevents memory leaks

### Performance Optimizations
- **Selective subscriptions**: Only subscribe to relevant product updates
- **Efficient updates**: Minimal re-renders using React state optimization
- **Subscription pooling**: Reuse connections for similar subscription types
- **Cleanup on unmount**: Prevent memory leaks with proper cleanup

## 🚀 Real-World Benefits

### For Customers
- **Always current information**: Never see outdated inventory or prices
- **Instant product discovery**: New products appear immediately
- **Better purchase decisions**: Real-time stock levels prevent disappointment

### For Sellers
- **Live business monitoring**: See your products update in real-time
- **Inventory management**: Immediate feedback on stock changes
- **Customer engagement**: Products reach customers instantly upon listing

### For Administrators
- **System monitoring**: Real-time view of marketplace activity
- **Performance insights**: Live subscription metrics and connection status
- **User engagement**: Enhanced user experience drives retention

## 📈 Future Enhancements

### Advanced Features
- **Real-time chat**: Customer-seller communication
- **Live auctions**: Real-time bidding system
- **Flash sales**: Time-sensitive promotional updates
- **Social features**: Live comments, likes, and reviews

### Analytics Integration
- **Live dashboard**: Real-time marketplace metrics
- **User behavior tracking**: Live interaction analytics
- **Performance monitoring**: Subscription health and performance

## 🔒 Security & Access Control

### Authentication Integration
- **Verified sellers only**: Only email-verified sellers can trigger product updates
- **User-specific subscriptions**: Sellers only see their own product updates in Local Shop
- **Admin oversight**: All updates subject to existing verification workflow

### Data Protection
- **Secure WebSocket connections**: Encrypted real-time communications
- **User authorization**: Subscription access based on user roles
- **Rate limiting**: Prevent subscription abuse and spam

---

## 🎉 Result

The implementation transforms the timelapse marketplace into a **truly live, interactive shopping experience** where:

1. **Products appear instantly** when added by verified sellers
2. **Inventory updates in real-time** across all connected devices  
3. **Users receive immediate notifications** about relevant changes
4. **Sellers manage inventory dynamically** with instant feedback
5. **The marketplace feels alive** with continuous, real-time activity

This creates a modern, engaging shopping experience that keeps users connected and informed, driving higher engagement and sales conversion rates. 