import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { styles } from './styles';
import { CartScreenProps, ProductData } from '../../types/interfaces';
import BottomTabBar from '../../components/common/BottomTabBar';
// Comment out Stripe imports for now to avoid native module errors
// import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51O8j2SHvQsLFfKgOROxGNCebmFWFoFVNnTGrUZqEbm5CJFL36Wv7zjy4S1zvT3qkdYR3hYbQP7lDFRkHOOEGAvfa00TrYbGO9P';
const API_URL = 'https://your-backend-api.com';

interface CartPaymentProps {
  cartItems: ProductData[];
  totalAmount: number;
  onPaymentSuccess: () => void;
  onPaymentFailed: () => void;
}

const CartPayment: React.FC<CartPaymentProps> = ({ cartItems, totalAmount, onPaymentSuccess, onPaymentFailed }) => {
  // Comment out Stripe hooks for now
  // const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  // Simplified non-Stripe implementation for now
  const handlePayment = async () => {
    setLoading(true);
    try {
      // Simulate payment processing
      setTimeout(() => {
        setLoading(false);
        onPaymentSuccess();
        Alert.alert('Success', 'Your payment was processed successfully!');
      }, 2000);
    } catch (error) {
      console.error('Error in payment process:', error);
      Alert.alert('Error', 'Payment failed to process');
      onPaymentFailed();
      setLoading(false);
    }
  };
  
  return (
    <View style={localStyles.paymentContainer}>
      <TouchableOpacity
        style={[
          localStyles.payButton,
          loading && localStyles.payButtonDisabled
        ]}
        disabled={loading}
        onPress={handlePayment}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={localStyles.payButtonText}>
            Pay ${totalAmount.toFixed(2)}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const CartScreen: React.FC<CartScreenProps> = ({
  onChangeScreen,
  cartItems,
  onRemoveFromCart,
  onUpdateQuantity,
  onClearCart,
}) => {
  const [totalAmount, setTotalAmount] = useState(0);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'payment', 'confirmation'
  
  useEffect(() => {
    // Calculate total price
    let total = 0;
    cartItems.forEach(item => {
      total += item.price * (item.quantity || 1);
    });
    setTotalAmount(total);
  }, [cartItems]);

  const handlePaymentSuccess = () => {
    setCheckoutStep('confirmation');
    onClearCart();
  };

  const handlePaymentFailed = () => {
    Alert.alert('Payment Failed', 'Please try again or use a different payment method.');
  };

  const renderCartItem = ({ item }: { item: ProductData }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemTitle}>{item.title}</Text>
        <Text style={styles.cartItemPrice}>${item.price.toFixed(2)}</Text>
      </View>
      
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => onRemoveFromCart(item)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantity || 1}</Text>
        
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => onUpdateQuantity(item, (item.quantity || 1) + 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.buyNowButton}
        onPress={() => {
          // Set cart to only this item and proceed to checkout
          onClearCart();
          onUpdateQuantity(item, 1);
          setCheckoutStep('payment');
        }}
      >
        <Text style={styles.buyNowButtonText}>Buy Now</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemoveFromCart(item, true)}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (checkoutStep) {
      case 'cart':
        return (
          <>
            {cartItems.length > 0 ? (
              <>
                <FlatList
                  data={cartItems}
                  renderItem={renderCartItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.cartContainer}
                  showsVerticalScrollIndicator={false}
                />
                
                <View style={styles.cartSummary}>
                  <View style={styles.totalContainer}>
                    <Text style={styles.summaryText}>Total: ${totalAmount.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={() => setCheckoutStep('payment')}
                  >
                    <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptyCartContainer}>
                <Text style={styles.emptyCartText}>
                  Your cart is empty. Visit the shop to add products!
                </Text>
                <TouchableOpacity
                  style={styles.shopButton}
                  onPress={() => onChangeScreen('shop')}
                >
                  <Text style={styles.shopButtonText}>Go to Shop</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        );
        
      case 'payment':
        return (
          <ScrollView contentContainerStyle={styles.paymentContainer}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            
            <View style={styles.orderSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items ({cartItems.length}):</Text>
                <Text style={styles.summaryValue}>${totalAmount.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping:</Text>
                <Text style={styles.summaryValue}>$0.00</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax:</Text>
                <Text style={styles.summaryValue}>$0.00</Text>
              </View>
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <CartPayment 
              cartItems={cartItems}
              totalAmount={totalAmount}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailed={handlePaymentFailed}
            />
            
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCheckoutStep('cart')}
            >
              <Text style={styles.backButtonText}>Back to Cart</Text>
            </TouchableOpacity>
          </ScrollView>
        );
        
      case 'confirmation':
        return (
          <View style={styles.confirmationContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            
            <Text style={styles.confirmationTitle}>
              Thank You For Your Order!
            </Text>
            
            <Text style={styles.confirmationText}>
              Your payment was successful and your order has been placed.
            </Text>
            
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => onChangeScreen('home')}
            >
              <Text style={styles.continueButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        Platform.OS === 'android' && styles.androidSafeTop,
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => onChangeScreen('shop')}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {checkoutStep === 'cart' ? 'Your Cart' : 
           checkoutStep === 'payment' ? 'Checkout' : 'Order Confirmation'}
        </Text>
        {checkoutStep === 'cart' && cartItems.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              Alert.alert(
                'Clear Cart',
                'Are you sure you want to remove all items from your cart?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', onPress: () => onClearCart() },
                ]
              );
            }}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderContent()}
      
      {checkoutStep === 'cart' && (
        <BottomTabBar currentScreen="shop" onChangeScreen={onChangeScreen} />
      )}
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  paymentContainer: {
    marginTop: 20,
  },
  payButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  payButtonDisabled: {
    backgroundColor: '#9B89FF',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CartScreen; 