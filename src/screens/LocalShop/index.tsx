import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  Modal,
  TextInput,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { generateClient } from 'aws-amplify/api';
import BottomTabBar from '../../components/common/BottomTabBar';

// Try importing with full paths - might help with path resolution issues
import SellerVerificationModal from '../ProfileScreen/components/SellerVerificationModal';

// Fallback interface in case import fails
export interface SellerVerificationData {
  businessName: string;
  businessType: string;
  taxId: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  businessDocuments: {
    identityProof: string;
    businessLicense: string;
    taxRegistration: string;
    bankStatement: string;
  };
  businessDescription: string;
  categories: string[];
  estimatedAnnualRevenue: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
}

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

interface ShopSettings {
  shopName: string;
  showEmail: boolean;
  showPhone: boolean;
  businessCategory: string;
  publicBio: string;
}

interface LocalShopProps {
  onChangeScreen: (screen: string) => void;
}

const LocalShop: React.FC<LocalShopProps> = ({ onChangeScreen }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [sellerStatus, setSellerStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    shopName: 'My Shop',
    showEmail: true,
    showPhone: false,
    businessCategory: 'General',
    publicBio: 'Welcome to my shop!'
  });
  const client = generateClient();
  const [viewOnly, setViewOnly] = useState(false);
  
  // Mock verification data for viewing
  const mockVerificationData: SellerVerificationData = {
    businessName: 'Sample Business',
    businessType: 'LLC',
    taxId: '123456789',
    businessAddress: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
    },
    contactInfo: {
      phone: '555-123-4567',
      email: 'business@example.com',
      website: 'www.samplebusiness.com',
    },
    businessDocuments: {
      identityProof: 'document_url_placeholder.pdf',
      businessLicense: 'document_url_placeholder.pdf',
      taxRegistration: 'document_url_placeholder.pdf',
      bankStatement: 'document_url_placeholder.pdf',
    },
    businessDescription: 'A sample business selling high-quality handmade products.',
    categories: ['Handmade', 'Crafts', 'Jewelry'],
    estimatedAnnualRevenue: '100000',
    socialMedia: {
      instagram: '@samplebusiness',
      facebook: 'Sample Business',
      twitter: '@samplebiz',
    },
    termsAccepted: true,
    privacyPolicyAccepted: true,
  };

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

  useEffect(() => {
    // Removed the setViewOnly from here to prevent automatic changes
    // The viewOnly state is now only modified when explicitly opening the modal
  }, [sellerStatus]);

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
    // Check verification status first
    if (sellerStatus === 'approved') {
      // Navigate to Add Product screen
      onChangeScreen('addproduct');
    } else if (sellerStatus === 'pending') {
      // Show warning for pending verification
      showVerificationWarning();
    } else {
      // Show verification modal for non-verified users
      Alert.alert('Verification Required', 'You need to complete seller verification first');
      openVerificationModal();
    }
  };

  const handleProductPress = (productId: string) => {
    // Mock navigation - replace with actual navigation when routes are configured
    Alert.alert('Navigate', `Would navigate to Product Details screen for product ${productId}`);
    // Use onChangeScreen when you implement product details
    // onChangeScreen('productDetails', { productId });
  };

  const handleVerificationSubmit = async (data: SellerVerificationData) => {
    try {
      console.log('Seller verification data submitted:', data);
      setSellerStatus('pending');
      setShowVerificationModal(false);
      Alert.alert(
        'Verification Submitted',
        'Your seller verification request has been submitted. We will review it and get back to you soon.'
      );
    } catch (error) {
      console.error('Error submitting verification:', error);
      Alert.alert('Error', 'Failed to submit verification request. Please try again.');
    }
  };

  const saveShopSettings = () => {
    setShowSettingsModal(false);
    Alert.alert('Success', 'Shop settings saved successfully!');
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

  const renderVerificationStatus = () => {
    switch (sellerStatus) {
      case 'approved':
        return (
          <View style={styles.verificationStatusContainer}>
            <Text style={[styles.verificationStatusText, styles.verificationApproved]}>
              ✅ Verified Seller
            </Text>
          </View>
        );
      case 'pending':
        return (
          <View style={styles.verificationStatusContainer}>
            <Text style={[styles.verificationStatusText, styles.verificationPending]}>
              ⏳ Verification Pending
            </Text>
            <Text style={styles.verificationSubtext}>
              Your application is under review. This typically takes 1-2 business days.
            </Text>
          </View>
        );
      default:
        return (
          <View style={styles.verificationStatusContainer}>
            <Text style={[styles.verificationStatusText, styles.verificationRequired]}>
              ⚠️ Verification Required
            </Text>
          </View>
        );
    }
  };

  // Show warning message for pending sellers trying to add products
  const showVerificationWarning = () => {
    if (sellerStatus === 'pending') {
      Alert.alert(
        'Verification Pending',
        'Your seller verification is still under review. You can add products once verified.'
      );
    }
  };

  // Use this function to force edit mode for the verification form
  const openVerificationModal = () => {
    // Check the current status and log it
    console.log('Current seller status before opening modal:', sellerStatus);
    
    // For unverified users (null status), we must force viewOnly to false to enable editing
    const shouldBeViewOnly = sellerStatus === 'approved' || sellerStatus === 'pending';
    setViewOnly(shouldBeViewOnly);
    setShowVerificationModal(true);
    
    console.log('Opening verification modal, viewOnly set to:', shouldBeViewOnly);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Local Shop</Text>
        <View style={styles.headerButtons}>
          {/* Make the verification button more prominent */}
          {sellerStatus !== 'approved' && (
            <TouchableOpacity
              style={[styles.verifyButton, { paddingHorizontal: 16, paddingVertical: 8 }]}
              onPress={() => {
                // Direct approach without debug dialog
                console.log('Opening verification form directly');
                // Reset modal state completely before showing
                setShowVerificationModal(false);
                // Force clean state
                setTimeout(() => {
                  setViewOnly(false); // Always force edit mode for direct verify button
                  setShowVerificationModal(true);
                }, 100);
              }}
            >
              <Text style={[styles.verifyButtonText, { fontSize: 16 }]}>
                {sellerStatus === 'pending' ? 'View Verification' : 'Verification Form'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.settingsButton, { marginLeft: 8, padding: 10 }]}
            onPress={() => setShowSettingsModal(true)}
          >
            <Text style={{ fontSize: 24, color: '#6B4EFF', textAlign: 'center' }}>⚙️</Text>
          </TouchableOpacity>
        </View>
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
        <>
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.productList}
          />
          
          <TouchableOpacity
            style={styles.floatingAddButton}
            onPress={handleAddProduct}
          >
            <Text style={styles.floatingAddButtonText}>+</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Shop Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSettingsModal}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Shop Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {/* Verification Status Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Verification Status</Text>
                {renderVerificationStatus()}
              </View>

              {/* Shop Information Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Shop Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Shop Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={shopSettings.shopName}
                    onChangeText={(text) => setShopSettings({...shopSettings, shopName: text})}
                    placeholder="Enter your shop name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Business Category</Text>
                  <TextInput
                    style={styles.textInput}
                    value={shopSettings.businessCategory}
                    onChangeText={(text) => setShopSettings({...shopSettings, businessCategory: text})}
                    placeholder="e.g., Electronics, Clothing, Accessories"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Public Bio</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={shopSettings.publicBio}
                    onChangeText={(text) => setShopSettings({...shopSettings, publicBio: text})}
                    placeholder="Tell customers about your shop"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>

              {/* Privacy Settings Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Privacy Settings</Text>
                
                <View style={styles.toggleOption}>
                  <Text style={styles.toggleLabel}>Show Email Address</Text>
                  <TouchableOpacity
                    style={[styles.toggle, shopSettings.showEmail && styles.toggleActive]}
                    onPress={() => setShopSettings({...shopSettings, showEmail: !shopSettings.showEmail})}
                  >
                    <View style={[styles.toggleHandle, shopSettings.showEmail && styles.toggleHandleActive]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.toggleOption}>
                  <Text style={styles.toggleLabel}>Show Phone Number</Text>
                  <TouchableOpacity
                    style={[styles.toggle, shopSettings.showPhone && styles.toggleActive]}
                    onPress={() => setShopSettings({...shopSettings, showPhone: !shopSettings.showPhone})}
                  >
                    <View style={[styles.toggleHandle, shopSettings.showPhone && styles.toggleHandleActive]} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveShopSettings}
              >
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Verification Modal */}
      <SellerVerificationModal
        key={`verification-modal-${Date.now()}`}
        visible={showVerificationModal}
        onClose={() => {
          console.log('Closing verification modal');
          setShowVerificationModal(false);
        }}
        onSubmit={handleVerificationSubmit}
        viewOnly={viewOnly}
        defaultData={undefined}
      />

      <BottomTabBar currentScreen="localshop" onChangeScreen={onChangeScreen} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
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
  verificationStatusContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    marginBottom: 16,
  },
  verificationStatusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  verificationApproved: {
    color: '#4CAF50',
  },
  verificationPending: {
    color: '#FF9800',
  },
  verificationRequired: {
    color: '#F44336',
  },
  verificationSubtext: {
    fontSize: 14,
    color: '#666',
  },
  startVerificationButton: {
    backgroundColor: '#6B4EFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  startVerificationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  floatingAddButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#6B4EFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingAddButtonText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    fontSize: 20,
    color: '#999',
  },
  modalScrollView: {
    padding: 16,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    padding: 3,
  },
  toggleActive: {
    backgroundColor: '#6B4EFF',
  },
  toggleHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleHandleActive: {
    transform: [{ translateX: 20 }],
  },
  saveButton: {
    backgroundColor: '#6B4EFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  viewVerificationButton: {
    backgroundColor: '#6B4EFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  verificationRequiredButton: {
    backgroundColor: '#F44336',
  },
  viewVerificationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LocalShop; 