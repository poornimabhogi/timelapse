import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import SellerVerificationForm, { SellerVerificationData } from './SellerVerificationForm';

interface SellerVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: SellerVerificationData) => Promise<void>;
  onDoItLater: () => void;
}

const SellerVerificationModal: React.FC<SellerVerificationModalProps> = ({
  visible,
  onClose,
  onSubmit,
  onDoItLater,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <SellerVerificationForm
          onSubmit={onSubmit}
          onCancel={onClose}
          onDoItLater={onDoItLater}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default SellerVerificationModal; 