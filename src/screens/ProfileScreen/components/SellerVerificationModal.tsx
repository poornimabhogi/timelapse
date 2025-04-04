import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, Text, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import SellerVerificationForm from './SellerVerificationForm';  // Import may fail

// Fallback interface if the import fails
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

interface SellerVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: SellerVerificationData) => Promise<void>;
  viewOnly?: boolean;
  defaultData?: SellerVerificationData;
}

const SellerVerificationModal: React.FC<SellerVerificationModalProps> = ({
  visible,
  onClose,
  onSubmit,
  viewOnly = false,
  defaultData,
}) => {
  // Track internal state to ensure modal is properly rendered
  const [isFormMounted, setIsFormMounted] = useState(false);
  
  // When visibility changes, properly manage the form mounting
  useEffect(() => {
    if (visible) {
      console.log('SellerVerificationModal - Modal is now visible');
      // Ensure form is mounted when modal becomes visible
      setIsFormMounted(true);
    } else {
      console.log('SellerVerificationModal - Modal is now hidden');
      // Delay unmounting form slightly to avoid animation issues
      setTimeout(() => {
        setIsFormMounted(false);
      }, 100);
    }
  }, [visible]);
  
  const handleClose = () => {
    console.log('SellerVerificationModal - Close button pressed');
    onClose();
  };

  // Debug information
  console.log('SellerVerificationModal render state:', {
    visible,
    viewOnly,
    isFormMounted,
    hasDefaultData: !!defaultData
  });
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {viewOnly ? 'Verification Details' : 'Verification Form'}
          </Text>
        </View>
        
        <Text style={styles.debugText}>
          Form Mode: {viewOnly ? 'VIEW ONLY' : 'EDIT MODE'}
        </Text>
        
        {isFormMounted && (
          <SellerVerificationForm
            onSubmit={onSubmit}
            onCancel={handleClose}
            defaultData={defaultData}
            viewOnly={viewOnly}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B4EFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 16,
  },
  debugText: {
    padding: 4,
    backgroundColor: '#f0f0f0',
    color: 'black',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default SellerVerificationModal; 