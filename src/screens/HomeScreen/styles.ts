import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  androidSafeTop: {
    paddingTop: StatusBar.currentHeight || 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  pointsBadge: {
    backgroundColor: '#FFF8E1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    color: '#E8A317',
    fontWeight: '600',
    fontSize: 14,
  },
  luckyDrawButtonContainer: {
    zIndex: 10,
    marginRight: 12,
  },
  luckyDrawButton: {
    backgroundColor: '#F0F0FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    minHeight: 36,
    justifyContent: 'center',
  },
  luckyDrawButtonText: {
    color: '#6B4EFF',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  viewAllText: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '600',
  },
  goalsContainer: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalIcon: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  goalProgress: {
    width: '100%',
  },
  goalText: {
    fontSize: 14, 
    color: '#666',
    marginTop: 4,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#6B4EFF',
    borderRadius: 3,
  },
  wishlistContainer: {
    gap: 12,
  },
  emptyWishlistContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyWishlistText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  wishlistItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  wishlistImageContainer: {
    marginRight: 12,
  },
  wishlistImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistImageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
  },
  wishlistItemInfo: {
    flex: 1,
  },
  wishlistItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  wishlistItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E88E5',
  },
  viewItemButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewItemButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  iosSpacer: {
    height: 84,
  },
  bottomNavSpacer: {
    height: 64,
  }
}); 