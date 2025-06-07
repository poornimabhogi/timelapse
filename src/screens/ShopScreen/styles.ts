import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
// Recalculated width to prevent overlap: available width minus total padding divided by 2 cards
const productCardWidth = Math.floor((screenWidth - (16 * 2) - 16) / 2); // Screen width - (left+right padding) - gap between cards

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  androidSafeTop: {
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    position: 'relative',
    padding: 8,
    marginRight: 12,
  },
  wishlistIcon: {
    fontSize: 24,
    color: '#333',
  },
  wishlistBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4081',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartContainer: {
    position: 'relative',
  },
  cartButton: {
    padding: 8,
    backgroundColor: '#F0F0FF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    fontSize: 20,
    color: '#6B4EFF',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4D4D',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesScrollView: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  selectedCategoryTab: {
    backgroundColor: '#1E88E5',
  },
  categoryTabText: {
    color: '#555',
    fontWeight: '600',
  },
  selectedCategoryTabText: {
    color: 'white',
    fontWeight: '600',
  },
  productsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  productCard: {
    width: productCardWidth,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF4081',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  productDetails: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E88E5',
    marginBottom: 8,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addToCartButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  wishlistButton: {
    padding: 6,
  },
  productWishlistIcon: {
    fontSize: 18,
    color: '#ccc',
  },
  activeWishlistIcon: {
    color: '#FF4081',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  quantityButton: {
    backgroundColor: '#E0E0E0',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantityText: {
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  iosSpacer: {
    height: 84,
  },
  bottomNavSpacer: {
    height: 64,
  },
  // Verified seller styles
  verifiedSellerProduct: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    zIndex: 1,
  },
  verifiedBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  sellerName: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  // Empty marketplace styles
  emptyMarketplace: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  emptyMarketplaceIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyMarketplaceTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMarketplaceText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  marketplaceInfo: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  marketplaceInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  marketplaceInfoItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    paddingLeft: 8,
  },
  emptyMarketplaceFooter: {
    fontSize: 14,
    color: '#6B4EFF',
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Real-time inventory and live update styles
  newProductHighlight: {
    borderWidth: 2,
    borderColor: '#FF4081',
    backgroundColor: '#FFF8FA',
    transform: [{ scale: 1.02 }],
  },
  inventoryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 1,
  },
  inStockBadge: {
    backgroundColor: '#4CAF50',
  },
  lowStockBadge: {
    backgroundColor: '#FF9800',
  },
  outOfStockBadge: {
    backgroundColor: '#F44336',
  },
  inventoryText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  outOfStockImage: {
    opacity: 0.5,
    filter: 'grayscale(100%)',
  },
  outOfStockText: {
    opacity: 0.6,
    textDecorationLine: 'line-through',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#CCCCCC',
  },
}); 