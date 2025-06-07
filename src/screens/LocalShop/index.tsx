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
import  awsConfig  from '../../services/aws-config';
import BottomTabBar from '../../components/common/BottomTabBar';
import { 
  sendSellerVerificationEmail, 
  saveSellerVerification, 
  getSellerVerificationStatus,
  updateSellerVerificationStatus,
  sendSellerStatusNotification 
} from '../../services/aws-config';
import { 
  subscribeToSellerUpdates, 
  unsubscribeFromAll,
  ProductSubscriptionCallbacks,
  updateInventory
} from '../../services/subscriptionService';

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
  const client = awsConfig.graphqlQuery;
  const [viewOnly, setViewOnly] = useState(false);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(false);
  


  useEffect(() => {
    fetchProducts();
    checkSellerVerificationStatus();
    setupSellerSubscriptions();
    
    return () => {
      console.log('LocalShop unmounted - cleaning up subscriptions');
      unsubscribeFromAll();
    };
  }, []);

  // Check seller verification status on component mount
  const checkSellerVerificationStatus = async () => {
    if (user?.uid) {
      try {
        const verificationData = await getSellerVerificationStatus(user.uid);
        if (verificationData) {
          setSellerStatus(verificationData.status);
          console.log('Current seller verification status:', verificationData.status);
        }
      } catch (error) {
        console.error('Error checking seller verification status:', error);
      }
    }
  };

  useEffect(() => {
    // Removed the setViewOnly from here to prevent automatic changes
    // The viewOnly state is now only modified when explicitly opening the modal
  }, [sellerStatus]);

  const fetchProducts = async () => {
    try {
      if (!user?.uid) {
        console.log('No authenticated user found');
        setProducts([]);
        return;
      }

      // Fetch real products for the authenticated user
      const query = `
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
          }
        }
      `;

      const response = await awsConfig.graphqlQuery(query, { sellerId: user.uid });
      
      if (response.data?.getUserProducts) {
        setProducts(response.data.getUserProducts);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      // Don't show alert for empty results, just log the error
      if (error?.message && !error.message.includes('No products found')) {
        Alert.alert('Error', 'Failed to fetch products');
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const setupSellerSubscriptions = () => {
    if (!user?.uid) return;
    
    console.log(`Setting up real-time updates for seller: ${user.uid}`);
    setLiveUpdatesEnabled(true);
    
    const callbacks: ProductSubscriptionCallbacks = {
      onProductCreated: (product) => {
        if (product.sellerId === user.uid) {
          console.log('🔴 LIVE: Your new product was added:', product.name);
          setProducts(prevProducts => [product, ...prevProducts]);
          
          Alert.alert(
            '✅ Product Added!', 
            `${product.name} is now live in your shop`,
            [{ text: 'Great!' }]
          );
        }
      },
      
      onProductUpdated: (product) => {
        if (product.sellerId === user.uid) {
          console.log('🟡 LIVE: Your product was updated:', product.name);
          setProducts(prevProducts => 
            prevProducts.map(p => 
              p.id === product.id ? { ...p, ...product } : p
            )
          );
        }
      },
      
      onProductDeleted: (product) => {
        if (product.sellerId === user.uid) {
          console.log('🔴 LIVE: Your product was removed:', product.id);
          setProducts(prevProducts => 
            prevProducts.filter(p => p.id !== product.id)
          );
        }
      },
      
      onInventoryChanged: (update) => {
        console.log(`📦 LIVE: Inventory updated for ${update.productId}: ${update.oldInventory} → ${update.newInventory}`);
        
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === update.productId 
              ? { ...p, inventory: update.newInventory }
              : p
          )
        );
        
        // Show notification for low stock
        if (update.newInventory < 5 && update.newInventory > 0) {
          Alert.alert(
            '⚠️ Low Stock Alert',
            `${products.find(p => p.id === update.productId)?.name || 'Product'} is running low (${update.newInventory} left)`,
            [{ text: 'OK' }]
          );
        }
      },
      
      onError: (error) => {
        console.error('Seller subscription error:', error);
        setLiveUpdatesEnabled(false);
      }
    };
    
    subscribeToSellerUpdates(user.uid, callbacks);
  };

  const handleAddProduct = () => {
    // STRICT CHECK: Only email-verified sellers can add products
    if (sellerStatus === 'approved') {
      // Confirmed verified seller - allow product addition
      Alert.alert(
        '🎉 Verified Seller Access',
        'Your email verification is complete! You have full access to add products to your local shop.',
        [
          {
            text: 'Add Product Now',
            onPress: () => onChangeScreen('addproduct')
          },
          {
            text: 'Maybe Later',
            style: 'cancel'
          }
        ]
      );
    } else if (sellerStatus === 'pending') {
      // Pending verification - show status
      showVerificationWarning();
    } else {
      // No verification - require email verification first
      Alert.alert(
        '🔒 Email Verification Required',
        'To add products and sell on Timelapse, you must complete email verification with our admin team.\n\n' +
        '✅ Secure verification process\n' +
        '📧 Admin approval via email\n' +
        '🛡️ Ensures marketplace trust\n\n' +
        'Start your verification now?',
        [
          {
            text: 'Start Verification',
            onPress: openVerificationModal
          },
          {
            text: 'Not Now',
            style: 'cancel'
          }
        ]
      );
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
      
      // Get current user ID
      const currentUserId = user?.uid || 'unknown';
      
      // Show the user that processing is happening
      Alert.alert('Processing', 'Submitting your verification request...');
      
      // Save verification data to database
      try {
        // First, save the verification data to our database
        await saveSellerVerification(data, currentUserId);
        
        // Then, send an email notification to the admin
        await sendSellerVerificationEmail(data);
        
        console.log('Verification data saved and email sent to admin');
        
        // Update seller status to pending
        setSellerStatus('pending');
        setShowVerificationModal(false);
        
        // Show comprehensive success message
        Alert.alert(
          'Verification Submitted Successfully! ✅',
          'Your seller verification request has been submitted and our admin team has been notified.\n\n' +
          '📧 Admin email sent to: poornima.bhogi1@gmail.com\n' +
          '⏱️ Review time: 1-2 business days\n' +
          '📱 You\'ll receive an email notification once reviewed\n\n' +
          'Thank you for your patience!',
          [
            {
              text: 'Understood',
              style: 'default'
            }
          ]
        );
      } catch (apiError) {
        console.error('Error processing verification request:', apiError);
        Alert.alert(
          'Submission Error', 
          'There was a problem submitting your verification. Please try again.'
        );
      }
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
      style={[styles.productCard, sellerStatus === 'approved' && styles.verifiedProductCard]}
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
        {/* Verified Seller Badge on Product Image */}
        {sellerStatus === 'approved' && (
          <View style={styles.productVerifiedBadge}>
            <Text style={styles.productVerifiedIcon}>✓</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
          {sellerStatus === 'approved' && (
            <Text style={styles.verifiedLabel}>Verified</Text>
          )}
        </View>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        {sellerStatus === 'approved' && (
          <Text style={styles.verifiedSellerTag}>✅ From Email-Verified Seller</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderVerificationStatus = () => {
    switch (sellerStatus) {
      case 'approved':
        return (
          <View style={[styles.verificationStatusContainer, styles.approvedStatusContainer]}>
            <View style={styles.approvedHeader}>
              <Text style={styles.verifiedIconLarge}>✓</Text>
              <View style={styles.approvedTextContainer}>
                <Text style={[styles.verificationStatusText, styles.verificationApproved]}>
                  🎉 Verified Seller - Email Approved!
                </Text>
                <Text style={styles.verificationSubtext}>
                  ✅ Verified via admin email • Full shop access granted
                </Text>
              </View>
            </View>
            <View style={styles.approvedBenefits}>
              <Text style={styles.benefitsTitle}>You can now:</Text>
              <Text style={styles.benefitItem}>📸 Add unlimited products</Text>
              <Text style={styles.benefitItem}>🏪 Manage your local shop</Text>
              <Text style={styles.benefitItem}>💰 Start selling immediately</Text>
              <Text style={styles.benefitItem}>📊 Access seller analytics</Text>
            </View>
          </View>
        );
      case 'pending':
        return (
          <View style={styles.verificationStatusContainer}>
            <Text style={[styles.verificationStatusText, styles.verificationPending]}>
              ⏳ Verification Under Review
            </Text>
            <Text style={styles.verificationSubtext}>
              📧 Admin notified at poornima.bhogi1@gmail.com
            </Text>
            <Text style={styles.verificationSubtext}>
              ⏱️ Expected review time: 1-2 business days
            </Text>
            <Text style={[styles.verificationSubtext, { fontSize: 12, fontStyle: 'italic' }]}>
              You'll receive an email notification once approved
            </Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={styles.verificationStatusContainer}>
            <Text style={[styles.verificationStatusText, styles.verificationRejected]}>
              ❌ Verification Needs Update
            </Text>
            <Text style={styles.verificationSubtext}>
              Please review admin feedback and resubmit
            </Text>
          </View>
        );
      default:
        return (
          <View style={styles.verificationStatusContainer}>
            <Text style={[styles.verificationStatusText, styles.verificationRequired]}>
              ⚠️ Verification Required for Selling
            </Text>
            <Text style={styles.verificationSubtext}>
              Complete email verification to unlock shop features
            </Text>
          </View>
        );
    }
  };

  // Show warning message for pending sellers trying to add products
  const showVerificationWarning = () => {
    if (sellerStatus === 'pending') {
      Alert.alert(
        'Verification Under Review ⏳',
        'Your seller verification is currently being reviewed by our admin team.\n\n' +
        '📧 Admin notified: poornima.bhogi1@gmail.com\n' +
        '⏱️ Typical review time: 1-2 business days\n' +
        '📱 You\'ll receive an email notification once approved\n\n' +
        'Once approved, you\'ll be able to add products to your shop.',
        [
          {
            text: 'View Application',
            onPress: () => {
              setViewOnly(true);
              setShowVerificationModal(true);
            }
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
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
        <View style={styles.titleContainer}>
          <Text style={styles.title}>My Local Shop</Text>
          {sellerStatus === 'approved' && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
              <Text style={styles.verifiedText}>Verified Seller</Text>
            </View>
          )}
          {liveUpdatesEnabled && (
            <View style={styles.liveStatusBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveStatusText}>LIVE</Text>
            </View>
          )}
        </View>
        <View style={styles.headerButtons}>
          {/* Show verification button only for non-approved sellers */}
          {sellerStatus !== 'approved' && (
            <TouchableOpacity
              style={[styles.verifyButton, { paddingHorizontal: 16, paddingVertical: 8 }]}
              onPress={() => {
                console.log('Opening verification form directly');
                setShowVerificationModal(false);
                setTimeout(() => {
                  setViewOnly(false);
                  setShowVerificationModal(true);
                }, 100);
              }}
            >
              <Text style={[styles.verifyButtonText, { fontSize: 16 }]}>
                {sellerStatus === 'pending' ? 'View Verification' : 'Get Verified'}
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
            {sellerStatus === 'approved' 
              ? "No products yet. Start by adding your first product!"
              : sellerStatus === 'pending'
              ? "Complete seller verification to start adding products to your shop."
              : "Complete seller verification to start your local shop and add products."
            }
          </Text>
          {sellerStatus === 'approved' && (
            <TouchableOpacity
              style={styles.addFirstProductButton}
              onPress={handleAddProduct}
            >
              <Text style={styles.addFirstProductText}>Add Your First Product</Text>
            </TouchableOpacity>
          )}
          {sellerStatus !== 'approved' && (
            <TouchableOpacity
              style={[styles.addFirstProductButton, styles.verificationButton]}
              onPress={openVerificationModal}
            >
              <Text style={styles.addFirstProductText}>
                {sellerStatus === 'pending' ? 'View Verification Status' : 'Start Seller Verification'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.productList}
          />
          
          {/* Only show add button for verified sellers */}
          {sellerStatus === 'approved' && (
            <TouchableOpacity
              style={styles.floatingAddButton}
              onPress={handleAddProduct}
            >
              <Text style={styles.floatingAddButtonText}>+</Text>
            </TouchableOpacity>
          )}
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
  titleContainer: {
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  verifiedIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 18,
    marginRight: 6,
  },
  verifiedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
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
  verificationButton: {
    backgroundColor: '#FF9800',
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
  verificationRejected: {
    color: '#F44336',
  },
  verificationSubtext: {
    fontSize: 14,
    color: '#666',
  },
  approvedStatusContainer: {
    backgroundColor: '#F0FFF0',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  approvedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifiedIconLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    textAlign: 'center',
    lineHeight: 36,
    marginRight: 12,
  },
  approvedTextContainer: {
    flex: 1,
  },
  approvedBenefits: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  benefitItem: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    paddingLeft: 8,
  },
  verifiedProductCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  productVerifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productVerifiedIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  verifiedLabel: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedSellerTag: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 4,
    fontStyle: 'italic',
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
  // Live status indicator styles
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default LocalShop; 