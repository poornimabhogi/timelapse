import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface SellerVerificationFormProps {
  onSubmit: (data: SellerVerificationData) => void;
  onCancel: () => void;
  onDoItLater: () => void;
}

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
}

const SellerVerificationForm: React.FC<SellerVerificationFormProps> = ({
  onSubmit,
  onCancel,
  onDoItLater,
}) => {
  const [formData, setFormData] = useState<Partial<SellerVerificationData>>({
    businessAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
    contactInfo: { phone: '', email: '', website: '' },
    businessDocuments: { businessLicense: '', taxRegistration: '', bankStatement: '' },
    socialMedia: { instagram: '', facebook: '', twitter: '' },
    categories: [],
  });
  const [loading, setLoading] = useState(false);

  const pickDocument = async (type: keyof SellerVerificationData['businessDocuments']) => {
    try {
      // In a real implementation, this would use a document picker
      // For now, we'll just simulate document selection
      setFormData(prev => ({
        ...prev,
        businessDocuments: {
          ...prev.businessDocuments,
          [type]: 'document_url_placeholder.pdf',
        },
      }) as Partial<SellerVerificationData>);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = [
      'businessName',
      'businessType',
      'taxId',
      'businessAddress',
      'contactInfo',
      'businessDocuments',
      'businessDescription',
      'categories',
      'estimatedAnnualRevenue',
    ] as const;

    const missingFields = requiredFields.filter(field => 
      !formData[field as keyof typeof formData]
    );
    if (missingFields.length > 0) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData as SellerVerificationData);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit verification form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Seller Verification</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.businessName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, businessName: text }) as Partial<SellerVerificationData>)}
            placeholder="Enter your business name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Type *</Text>
          <TextInput
            style={styles.input}
            value={formData.businessType}
            onChangeText={(text) => setFormData(prev => ({ ...prev, businessType: text }) as Partial<SellerVerificationData>)}
            placeholder="e.g., Sole Proprietorship, LLC, Corporation"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tax ID (EIN) *</Text>
          <TextInput
            style={styles.input}
            value={formData.taxId}
            onChangeText={(text) => setFormData(prev => ({ ...prev, taxId: text }) as Partial<SellerVerificationData>)}
            placeholder="Enter your Tax ID"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Address *</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Street Address</Text>
          <TextInput
            style={styles.input}
            value={formData.businessAddress?.street}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              businessAddress: { ...prev.businessAddress, street: text }
            }) as Partial<SellerVerificationData>)}
            placeholder="Enter street address"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={formData.businessAddress?.city}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                businessAddress: { ...prev.businessAddress, city: text }
              }) as Partial<SellerVerificationData>)}
              placeholder="City"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={formData.businessAddress?.state}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                businessAddress: { ...prev.businessAddress, state: text }
              }) as Partial<SellerVerificationData>)}
              placeholder="State"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>ZIP Code</Text>
            <TextInput
              style={styles.input}
              value={formData.businessAddress?.zipCode}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                businessAddress: { ...prev.businessAddress, zipCode: text }
              }) as Partial<SellerVerificationData>)}
              placeholder="ZIP Code"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.input}
              value={formData.businessAddress?.country}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                businessAddress: { ...prev.businessAddress, country: text }
              }) as Partial<SellerVerificationData>)}
              placeholder="Country"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information *</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.contactInfo?.phone}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              contactInfo: { ...prev.contactInfo, phone: text }
            }) as Partial<SellerVerificationData>)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.contactInfo?.email}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              contactInfo: { ...prev.contactInfo, email: text }
            }) as Partial<SellerVerificationData>)}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Website (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.contactInfo?.website}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              contactInfo: { ...prev.contactInfo, website: text }
            }) as Partial<SellerVerificationData>)}
            placeholder="Enter website URL"
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Documents *</Text>
        
        <View style={styles.documentUpload}>
          <Text style={styles.label}>Business License</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickDocument('businessLicense')}
          >
            <Icon name="document" size={24} color="#6B4EFF" />
            <Text style={styles.uploadText}>
              {formData.businessDocuments?.businessLicense ? 'Change Document' : 'Upload Document'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.documentUpload}>
          <Text style={styles.label}>Tax Registration</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickDocument('taxRegistration')}
          >
            <Icon name="document" size={24} color="#6B4EFF" />
            <Text style={styles.uploadText}>
              {formData.businessDocuments?.taxRegistration ? 'Change Document' : 'Upload Document'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.documentUpload}>
          <Text style={styles.label}>Bank Statement (Last 3 months)</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickDocument('bankStatement')}
          >
            <Icon name="document" size={24} color="#6B4EFF" />
            <Text style={styles.uploadText}>
              {formData.businessDocuments?.bankStatement ? 'Change Document' : 'Upload Document'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Details *</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.businessDescription}
            onChangeText={(text) => setFormData(prev => ({ ...prev, businessDescription: text }) as Partial<SellerVerificationData>)}
            placeholder="Describe your business and products"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Categories</Text>
          <TextInput
            style={styles.input}
            value={formData.categories?.join(', ')}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              categories: text.split(',').map(cat => cat.trim())
            }) as Partial<SellerVerificationData>)}
            placeholder="e.g., Electronics, Clothing, Home Goods"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estimated Annual Revenue</Text>
          <TextInput
            style={styles.input}
            value={formData.estimatedAnnualRevenue}
            onChangeText={(text) => setFormData(prev => ({ ...prev, estimatedAnnualRevenue: text }) as Partial<SellerVerificationData>)}
            placeholder="Enter estimated annual revenue"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Media (Optional)</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Instagram</Text>
          <TextInput
            style={styles.input}
            value={formData.socialMedia?.instagram}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              socialMedia: { ...prev.socialMedia, instagram: text }
            }) as Partial<SellerVerificationData>)}
            placeholder="Instagram username"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Facebook</Text>
          <TextInput
            style={styles.input}
            value={formData.socialMedia?.facebook}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              socialMedia: { ...prev.socialMedia, facebook: text }
            }) as Partial<SellerVerificationData>)}
            placeholder="Facebook page URL"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Twitter</Text>
          <TextInput
            style={styles.input}
            value={formData.socialMedia?.twitter}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              socialMedia: { ...prev.socialMedia, twitter: text }
            }) as Partial<SellerVerificationData>)}
            placeholder="Twitter handle"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.laterButton]}
          onPress={onDoItLater}
        >
          <Text style={[styles.buttonText, styles.laterButtonText]}>
            Do It Later
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={[styles.buttonText, styles.cancelButtonText]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
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
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  documentUpload: {
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6B4EFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  uploadText: {
    marginLeft: 8,
    color: '#6B4EFF',
    fontSize: 16,
  },
  buttonContainer: {
    padding: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#6B4EFF',
  },
  laterButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  laterButtonText: {
    color: '#333',
  },
  cancelButtonText: {
    color: '#666',
  },
});

export default SellerVerificationForm; 