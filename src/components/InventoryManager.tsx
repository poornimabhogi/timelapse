import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { updateInventory, monitorProductInventory } from '../services/subscriptionService';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  sellerId: string;
  inventory?: number;
  createdAt: string;
  updatedAt: string;
}

interface InventoryManagerProps {
  product: Product;
  onInventoryUpdate: (productId: string, newInventory: number) => void;
  visible: boolean;
  onClose: () => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({
  product,
  onInventoryUpdate,
  visible,
  onClose,
}) => {
  const [currentInventory, setCurrentInventory] = useState(product.inventory || 0);
  const [newInventory, setNewInventory] = useState(product.inventory?.toString() || '0');
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [inventoryHistory, setInventoryHistory] = useState<any[]>([]);

  useEffect(() => {
    if (visible && product.id) {
      setCurrentInventory(product.inventory || 0);
      setNewInventory((product.inventory || 0).toString());
      setupInventoryMonitoring();
    }
  }, [visible, product]);

  const setupInventoryMonitoring = () => {
    console.log(`Setting up inventory monitoring for product: ${product.name}`);
    
    const subscriptionKey = monitorProductInventory([product.id], (update) => {
      console.log('Real-time inventory update received:', update);
      setCurrentInventory(update.newInventory);
      setInventoryHistory(prev => [update, ...prev].slice(0, 10)); // Keep last 10 updates
    });

    return subscriptionKey;
  };

  const handleInventoryUpdate = async () => {
    const newInventoryNumber = parseInt(newInventory);
    
    if (isNaN(newInventoryNumber) || newInventoryNumber < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid inventory number (0 or greater)');
      return;
    }

    if (newInventoryNumber === currentInventory) {
      Alert.alert('No Change', 'New inventory value is the same as current value');
      return;
    }

    setIsUpdating(true);
    
    try {
      const success = await updateInventory(
        product.id, 
        newInventoryNumber, 
        reason || 'Manual update'
      );

      if (success) {
        Alert.alert(
          '✅ Inventory Updated!',
          `${product.name} inventory updated from ${currentInventory} to ${newInventoryNumber}`,
          [
            {
              text: 'OK',
              onPress: () => {
                onInventoryUpdate(product.id, newInventoryNumber);
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to update inventory. Please try again.');
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      Alert.alert('Error', 'Failed to update inventory. Please check your connection and try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickUpdate = (change: number) => {
    const newValue = Math.max(0, currentInventory + change);
    setNewInventory(newValue.toString());
    setReason(change > 0 ? 'Quick increase' : 'Quick decrease');
  };

  const getInventoryStatus = () => {
    const inventory = parseInt(newInventory) || 0;
    if (inventory === 0) return { status: 'Out of Stock', color: '#F44336', icon: '❌' };
    if (inventory < 5) return { status: 'Low Stock', color: '#FF9800', icon: '⚠️' };
    return { status: 'In Stock', color: '#4CAF50', icon: '✅' };
  };

  const inventoryStatus = getInventoryStatus();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Inventory Manager</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Product Info */}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productCategory}>{product.category}</Text>
            </View>

            {/* Current Inventory Status */}
            <View style={styles.statusContainer}>
              <Text style={styles.sectionTitle}>Current Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: inventoryStatus.color }]}>
                <Text style={styles.statusIcon}>{inventoryStatus.icon}</Text>
                <Text style={styles.statusText}>{inventoryStatus.status}</Text>
              </View>
              <Text style={styles.currentInventoryText}>
                Current Inventory: <Text style={styles.inventoryNumber}>{currentInventory}</Text>
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickButtons}>
                <TouchableOpacity 
                  style={[styles.quickButton, styles.decreaseButton]}
                  onPress={() => handleQuickUpdate(-1)}
                >
                  <Text style={styles.quickButtonText}>-1</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.quickButton, styles.decreaseButton]}
                  onPress={() => handleQuickUpdate(-5)}
                >
                  <Text style={styles.quickButtonText}>-5</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.quickButton, styles.increaseButton]}
                  onPress={() => handleQuickUpdate(+1)}
                >
                  <Text style={styles.quickButtonText}>+1</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.quickButton, styles.increaseButton]}
                  onPress={() => handleQuickUpdate(+5)}
                >
                  <Text style={styles.quickButtonText}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Manual Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.sectionTitle}>Set New Inventory</Text>
              <TextInput
                style={styles.inventoryInput}
                value={newInventory}
                onChangeText={setNewInventory}
                placeholder="Enter new inventory count"
                keyboardType="numeric"
                selectTextOnFocus
              />
              
              <Text style={styles.inputLabel}>Reason (optional)</Text>
              <TextInput
                style={styles.reasonInput}
                value={reason}
                onChangeText={setReason}
                placeholder="e.g., Stock delivery, Sale adjustment, etc."
                multiline
              />
            </View>

            {/* Recent Updates */}
            {inventoryHistory.length > 0 && (
              <View style={styles.historyContainer}>
                <Text style={styles.sectionTitle}>Recent Updates</Text>
                {inventoryHistory.slice(0, 3).map((update, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyChange}>
                      {update.oldInventory} → {update.newInventory}
                    </Text>
                    <Text style={styles.historyReason}>{update.reason}</Text>
                    <Text style={styles.historyTime}>
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Update Button */}
            <TouchableOpacity
              style={[styles.updateButton, isUpdating && styles.updatingButton]}
              onPress={handleInventoryUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.updateButtonText}>Update Inventory</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalBody: {
    padding: 20,
  },
  productInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  statusContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  currentInventoryText: {
    fontSize: 16,
    color: '#333',
  },
  inventoryNumber: {
    fontWeight: '700',
    color: '#6B4EFF',
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  decreaseButton: {
    backgroundColor: '#FFE5E5',
  },
  increaseButton: {
    backgroundColor: '#E5F5E5',
  },
  quickButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inventoryInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
  },
  historyContainer: {
    marginBottom: 20,
  },
  historyItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyChange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  historyReason: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  updateButton: {
    backgroundColor: '#6B4EFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  updatingButton: {
    backgroundColor: '#B0A0FF',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InventoryManager; 