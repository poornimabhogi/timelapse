import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { generateClient } from 'aws-amplify/api';

// Mock query - replace with actual GraphQL query when available
const listProducts = `query ListProducts($filter: ModelProductFilterInput) {
  listProducts(filter: $filter) {
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
    }
  }
}`;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
}

const LocalShop: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const client = generateClient();

  // Mock product data for testing
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Sample Product',
      description: 'This is a sample product',
      price: 19.99,
      images: ['https://via.placeholder.com/150'],
      category: 'Electronics',
      sellerId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // For now, use mock data instead of actual API call
      // Uncomment this when API is ready
      /*
      const response = await client.graphql({
        query: listProducts,
        variables: {
          filter: {
            sellerId: { eq: user?.id },
          },
        },
      });
      setProducts(response.data.listProducts.items);
      */
      
      // Use mock data for now
      setProducts(mockProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    // Mock navigation - replace with actual navigation when routes are configured
    Alert.alert('Navigate', 'Would navigate to Add Product screen');
    // navigation.navigate('AddProduct');
  };

  const handleProductPress = (productId: string) => {
    // Mock navigation - replace with actual navigation when routes are configured
    Alert.alert('Navigate', `Would navigate to Product Details screen for product ${productId}`);
    // navigation.navigate('ProductDetails', { productId });
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item.id)}
    >
      <View style={styles.productImageContainer}>
        {item.images[0] ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.productImage}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={{ fontSize: 40, color: '#CCCCCC' }}>📷</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Local Shop</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddProduct}
        >
          <Text style={{ fontSize: 24, color: '#FFFFFF' }}>+</Text>
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 64, color: '#CCCCCC' }}>🏪</Text>
          <Text style={styles.emptyStateText}>
            No products yet. Start by adding your first product!
          </Text>
          <TouchableOpacity
            style={styles.addFirstProductButton}
            onPress={handleAddProduct}
          >
            <Text style={styles.addFirstProductText}>Add Your First Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#6B4EFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B4EFF',
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addFirstProductButton: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstProductText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LocalShop; 