import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image,
  Switch
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'react-native-image-picker';

interface SellerVerificationFormProps {
  onSubmit: (data: SellerVerificationData) => void;
  onCancel: () => void;
  defaultData?: SellerVerificationData;
  viewOnly?: boolean;
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

const SellerVerificationForm: React.FC<SellerVerificationFormProps> = ({
  onSubmit,
  onCancel,
  defaultData,
  viewOnly = false,
}) => {
  const [step, setStep] = useState(1);
  
  // Enhanced debug logging with alert to confirm rendering
  console.log('SellerVerificationForm RENDERING:');
  console.log('- viewOnly:', viewOnly);
  console.log('- defaultData provided:', !!defaultData);
  console.log('- current step:', step);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<SellerVerificationData>>(
    defaultData || {
      businessName: '',
      businessType: '',
      taxId: '',
      businessAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
      contactInfo: { phone: '', email: '', website: '' },
      businessDocuments: { identityProof: '', businessLicense: '', taxRegistration: '', bankStatement: '' },
      socialMedia: { instagram: '', facebook: '', twitter: '' },
      categories: [],
      estimatedAnnualRevenue: '',
      termsAccepted: false,
      privacyPolicyAccepted: false
    }
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Force-set viewOnly to false for unverified sellers to ensure form is editable
  useEffect(() => {
    console.log('SellerVerificationForm mounted - viewOnly mode is:', viewOnly);
    
    // Make sure we're showing the first step when not in viewOnly mode
    if (!viewOnly) {
      setStep(1);
      console.log('Resetting to step 1 for edit mode');
    }
  }, [viewOnly]);

  // Log when the form becomes visible
  useEffect(() => {
    if (step !== 1 && !viewOnly) {
      console.log(`Form progressed to step ${step}`);
    }
  }, [step, viewOnly]);

  const pickDocument = async (type: keyof SellerVerificationData['businessDocuments']) => {
    try {
      const options: ImagePicker.ImageLibraryOptions = {
        mediaType: 'photo' as ImagePicker.MediaType,
        includeBase64: false,
        maxHeight: 1200,
        maxWidth: 1200,
      };

      const result = await ImagePicker.launchImageLibrary(options);
      
      if (result.assets && result.assets[0].uri) {
        setFormData(prev => ({
          ...prev,
          businessDocuments: {
            ...prev.businessDocuments,
            [type]: result.assets![0].uri,
          },
        }) as Partial<SellerVerificationData>);
        
        // Clear error for this field if it exists
        if (fieldErrors[`businessDocuments.${type}`]) {
          const newErrors = {...fieldErrors};
          delete newErrors[`businessDocuments.${type}`];
          setFieldErrors(newErrors);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const validateForm = (stepToValidate: number): boolean => {
    const errors: Record<string, string> = {};
    
    if (stepToValidate === 1) {
      if (!formData.businessName?.trim()) {
        errors['businessName'] = 'Business name is required';
      }
      
      if (!formData.businessType?.trim()) {
        errors['businessType'] = 'Business type is required';
      }
      
      if (!formData.taxId?.trim()) {
        errors['taxId'] = 'Tax ID is required';
      } else if (!/^\d{9}$/.test(formData.taxId.trim())) {
        errors['taxId'] = 'Tax ID must be 9 digits';
      }
      
      if (!formData.businessAddress?.street?.trim()) {
        errors['businessAddress.street'] = 'Street address is required';
      }
      
      if (!formData.businessAddress?.city?.trim()) {
        errors['businessAddress.city'] = 'City is required';
      }
      
      if (!formData.businessAddress?.state?.trim()) {
        errors['businessAddress.state'] = 'State is required';
      }
      
      if (!formData.businessAddress?.zipCode?.trim()) {
        errors['businessAddress.zipCode'] = 'ZIP code is required';
      }
      
      if (!formData.businessAddress?.country?.trim()) {
        errors['businessAddress.country'] = 'Country is required';
      }
    }
    
    if (stepToValidate === 2) {
      if (!formData.contactInfo?.phone?.trim()) {
        errors['contactInfo.phone'] = 'Phone number is required';
      }
      
      if (!formData.contactInfo?.email?.trim()) {
        errors['contactInfo.email'] = 'Email is required';
      } else if (!/^\S+@\S+\.\S+$/.test(formData.contactInfo.email.trim())) {
        errors['contactInfo.email'] = 'Please enter a valid email address';
      }
      
      if (!formData.businessDescription?.trim()) {
        errors['businessDescription'] = 'Business description is required';
      }
      
      if (!formData.categories?.length) {
        errors['categories'] = 'At least one category is required';
      }
    }
    
    if (stepToValidate === 3) {
      if (!formData.businessDocuments?.identityProof) {
        errors['businessDocuments.identityProof'] = 'Identity proof is required';
      }
      
      if (!formData.businessDocuments?.businessLicense) {
        errors['businessDocuments.businessLicense'] = 'Business license is required';
      }
      
      if (!formData.businessDocuments?.taxRegistration) {
        errors['businessDocuments.taxRegistration'] = 'Tax registration document is required';
      }
    }
    
    if (stepToValidate === 4) {
      if (!formData.termsAccepted) {
        errors['termsAccepted'] = 'You must accept the terms and conditions';
      }
      
      if (!formData.privacyPolicyAccepted) {
        errors['privacyPolicyAccepted'] = 'You must accept the privacy policy';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateForm(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateForm(step)) {
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

  const toggleCategory = (category: string) => {
    setFormData(prev => {
      const currentCategories = prev.categories || [];
      
      let newCategories;
      if (currentCategories.includes(category)) {
        newCategories = currentCategories.filter(c => c !== category);
      } else {
        newCategories = [...currentCategories, category];
      }
      
      // Clear category error if at least one is selected
      if (newCategories.length > 0 && fieldErrors['categories']) {
        const newErrors = {...fieldErrors};
        delete newErrors['categories'];
        setFieldErrors(newErrors);
      }
      
      return {
        ...prev,
        categories: newCategories
      } as Partial<SellerVerificationData>;
    });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map(number => (
        <View 
          key={number} 
          style={[
            styles.stepDot,
            step >= number ? styles.stepDotActive : styles.stepDotInactive
          ]}
        />
      ))}
    </View>
  );

  const renderError = (field: string) => {
    return fieldErrors[field] ? (
      <Text style={styles.errorText}>{fieldErrors[field]}</Text>
    ) : null;
  };

  // Available business categories
  const availableCategories = [
    'Electronics', 'Clothing', 'Home & Garden', 'Beauty & Health', 
    'Toys & Games', 'Books & Media', 'Food & Beverages', 'Jewelry',
    'Art & Crafts', 'Sports & Outdoors', 'Automotive', 'Other'
  ];

  // Business type options
  const businessTypes = [
    'Sole Proprietorship', 'LLC', 'Corporation', 'Partnership', 'Non-profit'
  ];

  const renderStep1 = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>{viewOnly ? "Business Information" : "Business Information"}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Name *</Text>
        <TextInput
          style={[styles.input, fieldErrors['businessName'] ? styles.inputError : null]}
          value={formData.businessName}
          onChangeText={(text) => !viewOnly && setFormData(prev => ({ ...prev, businessName: text }) as Partial<SellerVerificationData>)}
          placeholder="Enter your business name"
          editable={!viewOnly}
        />
        {!viewOnly && renderError('businessName')}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Type *</Text>
        {viewOnly ? (
          <Text style={styles.readOnlyValue}>{formData.businessType}</Text>
        ) : (
          <View style={styles.businessTypeContainer}>
            {businessTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.businessTypeButton,
                  formData.businessType === type && styles.businessTypeButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, businessType: type }) as Partial<SellerVerificationData>)}
              >
                <Text 
                  style={[
                    styles.businessTypeText,
                    formData.businessType === type && styles.businessTypeTextActive
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {!viewOnly && renderError('businessType')}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tax ID (EIN) *</Text>
        <TextInput
          style={[styles.input, fieldErrors['taxId'] ? styles.inputError : null]}
          value={formData.taxId}
          onChangeText={(text) => setFormData(prev => ({ ...prev, taxId: text }) as Partial<SellerVerificationData>)}
          placeholder="Enter your Tax ID (9 digits)"
          keyboardType="numeric"
          maxLength={9}
        />
        {renderError('taxId')}
      </View>

      <Text style={styles.subsectionTitle}>Business Address</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Street Address *</Text>
        <TextInput
          style={[styles.input, fieldErrors['businessAddress.street'] ? styles.inputError : null]}
          value={formData.businessAddress?.street}
          onChangeText={(text) => setFormData(prev => ({
            ...prev,
            businessAddress: { ...prev.businessAddress, street: text }
          }) as Partial<SellerVerificationData>)}
          placeholder="Enter street address"
        />
        {renderError('businessAddress.street')}
      </View>
      
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={[styles.input, fieldErrors['businessAddress.city'] ? styles.inputError : null]}
            value={formData.businessAddress?.city}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              businessAddress: { ...prev.businessAddress, city: text }
            }) as Partial<SellerVerificationData>)}
            placeholder="City"
          />
          {renderError('businessAddress.city')}
        </View>
        
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={[styles.input, fieldErrors['businessAddress.state'] ? styles.inputError : null]}
            value={formData.businessAddress?.state}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              businessAddress: { ...prev.businessAddress, state: text }
            }) as Partial<SellerVerificationData>)}
            placeholder="State"
          />
          {renderError('businessAddress.state')}
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>ZIP Code *</Text>
          <TextInput
            style={[styles.input, fieldErrors['businessAddress.zipCode'] ? styles.inputError : null]}
            value={formData.businessAddress?.zipCode}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              businessAddress: { ...prev.businessAddress, zipCode: text }
            }) as Partial<SellerVerificationData>)}
            placeholder="ZIP Code"
            keyboardType="numeric"
          />
          {renderError('businessAddress.zipCode')}
        </View>
        
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Country *</Text>
          <TextInput
            style={[styles.input, fieldErrors['businessAddress.country'] ? styles.inputError : null]}
            value={formData.businessAddress?.country}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              businessAddress: { ...prev.businessAddress, country: text }
            }) as Partial<SellerVerificationData>)}
            placeholder="Country"
          />
          {renderError('businessAddress.country')}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Contact Information & Business Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={[styles.input, fieldErrors['contactInfo.phone'] ? styles.inputError : null]}
          value={formData.contactInfo?.phone}
          onChangeText={(text) => setFormData(prev => ({
            ...prev,
            contactInfo: { ...prev.contactInfo, phone: text }
          }) as Partial<SellerVerificationData>)}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
        {renderError('contactInfo.phone')}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={[styles.input, fieldErrors['contactInfo.email'] ? styles.inputError : null]}
          value={formData.contactInfo?.email}
          onChangeText={(text) => setFormData(prev => ({
            ...prev,
            contactInfo: { ...prev.contactInfo, email: text }
          }) as Partial<SellerVerificationData>)}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {renderError('contactInfo.email')}
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
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Description *</Text>
        <TextInput
          style={[
            styles.input, 
            styles.textArea, 
            fieldErrors['businessDescription'] ? styles.inputError : null
          ]}
          value={formData.businessDescription}
          onChangeText={(text) => setFormData(prev => ({ 
            ...prev, 
            businessDescription: text 
          }) as Partial<SellerVerificationData>)}
          placeholder="Describe your business, products, and services..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        {renderError('businessDescription')}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Categories *</Text>
        <Text style={styles.helperText}>Select all that apply</Text>
        {renderError('categories')}
        
        <View style={styles.categoriesContainer}>
          {availableCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                formData.categories?.includes(category) ? styles.categoryButtonActive : {}
              ]}
              onPress={() => toggleCategory(category)}
            >
              <Text 
                style={[
                  styles.categoryText,
                  formData.categories?.includes(category) ? styles.categoryTextActive : {}
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Estimated Annual Revenue *</Text>
        <TextInput
          style={styles.input}
          value={formData.estimatedAnnualRevenue}
          onChangeText={(text) => setFormData(prev => ({ 
            ...prev, 
            estimatedAnnualRevenue: text 
          }) as Partial<SellerVerificationData>)}
          placeholder="Enter estimated annual revenue"
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Document Verification</Text>
      <Text style={styles.documentHelper}>
        Please upload clear photos or scans of the following documents to verify your business identity. 
        Files should be in JPG, PNG, or PDF format and under 5MB each.
      </Text>
      
      <View style={styles.documentUpload}>
        <Text style={styles.label}>Identity Proof (ID Card, Passport, Driver's License) *</Text>
        <TouchableOpacity 
          style={[
            styles.uploadButton,
            fieldErrors['businessDocuments.identityProof'] ? styles.uploadButtonError : null
          ]} 
          onPress={() => pickDocument('identityProof')}
        >
          <Icon name="id-card-outline" size={24} color="#6B4EFF" />
          <Text style={styles.uploadText}>
            {formData.businessDocuments?.identityProof ? 'Document Uploaded' : 'Upload Identity Document'}
          </Text>
        </TouchableOpacity>
        {renderError('businessDocuments.identityProof')}
      </View>
      
      <View style={styles.documentUpload}>
        <Text style={styles.label}>Business License *</Text>
        <TouchableOpacity 
          style={[
            styles.uploadButton,
            fieldErrors['businessDocuments.businessLicense'] ? styles.uploadButtonError : null
          ]} 
          onPress={() => pickDocument('businessLicense')}
        >
          <Icon name="document-text-outline" size={24} color="#6B4EFF" />
          <Text style={styles.uploadText}>
            {formData.businessDocuments?.businessLicense ? 'Document Uploaded' : 'Upload Business License'}
          </Text>
        </TouchableOpacity>
        {renderError('businessDocuments.businessLicense')}
      </View>
      
      <View style={styles.documentUpload}>
        <Text style={styles.label}>Tax Registration Document *</Text>
        <TouchableOpacity 
          style={[
            styles.uploadButton,
            fieldErrors['businessDocuments.taxRegistration'] ? styles.uploadButtonError : null
          ]} 
          onPress={() => pickDocument('taxRegistration')}
        >
          <Icon name="document-text-outline" size={24} color="#6B4EFF" />
          <Text style={styles.uploadText}>
            {formData.businessDocuments?.taxRegistration ? 'Document Uploaded' : 'Upload Tax Registration'}
          </Text>
        </TouchableOpacity>
        {renderError('businessDocuments.taxRegistration')}
      </View>
      
      <View style={styles.documentUpload}>
        <Text style={styles.label}>Bank Statement or Canceled Check (Optional)</Text>
        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={() => pickDocument('bankStatement')}
        >
          <Icon name="document-text-outline" size={24} color="#6B4EFF" />
          <Text style={styles.uploadText}>
            {formData.businessDocuments?.bankStatement ? 'Document Uploaded' : 'Upload Bank Statement'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.securityNote}>
        <Icon name="shield-checkmark" size={24} color="#6B4EFF" />
        <Text style={styles.securityText}>
          Your documents are securely encrypted and will only be used for verification purposes.
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Review & Submit</Text>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Business Information</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Business Name:</Text>
          <Text style={styles.reviewValue}>{formData.businessName}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Business Type:</Text>
          <Text style={styles.reviewValue}>{formData.businessType}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Tax ID:</Text>
          <Text style={styles.reviewValue}>{formData.taxId}</Text>
        </View>
      </View>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Address</Text>
        <Text style={styles.reviewValue}>
          {formData.businessAddress?.street}, {formData.businessAddress?.city}, {formData.businessAddress?.state} {formData.businessAddress?.zipCode}, {formData.businessAddress?.country}
        </Text>
      </View>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Contact Information</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Phone:</Text>
          <Text style={styles.reviewValue}>{formData.contactInfo?.phone}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Email:</Text>
          <Text style={styles.reviewValue}>{formData.contactInfo?.email}</Text>
        </View>
        {formData.contactInfo?.website && (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Website:</Text>
            <Text style={styles.reviewValue}>{formData.contactInfo.website}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Business Categories</Text>
        <Text style={styles.reviewValue}>{formData.categories?.join(', ')}</Text>
      </View>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Documents Uploaded</Text>
        <View style={styles.reviewItem}>
          <Icon name={formData.businessDocuments?.identityProof ? "checkmark-circle" : "close-circle"} size={18} color={formData.businessDocuments?.identityProof ? "#4CAF50" : "#F44336"} />
          <Text style={styles.reviewValue}>Identity Proof</Text>
        </View>
        <View style={styles.reviewItem}>
          <Icon name={formData.businessDocuments?.businessLicense ? "checkmark-circle" : "close-circle"} size={18} color={formData.businessDocuments?.businessLicense ? "#4CAF50" : "#F44336"} />
          <Text style={styles.reviewValue}>Business License</Text>
        </View>
        <View style={styles.reviewItem}>
          <Icon name={formData.businessDocuments?.taxRegistration ? "checkmark-circle" : "close-circle"} size={18} color={formData.businessDocuments?.taxRegistration ? "#4CAF50" : "#F44336"} />
          <Text style={styles.reviewValue}>Tax Registration</Text>
        </View>
        <View style={styles.reviewItem}>
          <Icon name={formData.businessDocuments?.bankStatement ? "checkmark-circle" : "close-circle"} size={18} color={formData.businessDocuments?.bankStatement ? "#4CAF50" : "#F44336"} />
          <Text style={styles.reviewValue}>Bank Statement (Optional)</Text>
        </View>
      </View>
      
      <View style={styles.termsContainer}>
        <View style={styles.termRow}>
          <Switch
            value={formData.termsAccepted}
            onValueChange={(value) => setFormData(prev => ({ ...prev, termsAccepted: value }))}
            trackColor={{ false: '#E0E0E0', true: '#6B4EFF' }}
            thumbColor="#FFFFFF"
          />
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Terms and Conditions</Text> for sellers
          </Text>
        </View>
        {renderError('termsAccepted')}
        
        <View style={styles.termRow}>
          <Switch
            value={formData.privacyPolicyAccepted}
            onValueChange={(value) => setFormData(prev => ({ ...prev, privacyPolicyAccepted: value }))}
            trackColor={{ false: '#E0E0E0', true: '#6B4EFF' }}
            thumbColor="#FFFFFF"
          />
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
        {renderError('privacyPolicyAccepted')}
      </View>
      
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          By submitting this form, you certify that all information provided is accurate and complete. 
          False information may result in rejection of your application or termination of your seller account.
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{viewOnly ? "Verification Details" : "Seller Verification"}</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      
      {!viewOnly && renderStepIndicator()}
      
      <ScrollView style={styles.scrollContainer}>
        {viewOnly ? (
          renderStep4() // In view-only mode, just show the review/summary
        ) : (
          <>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </>
        )}
      </ScrollView>
      
      {!viewOnly && (
        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.prevButton]}
              onPress={handlePrevStep}
            >
              <Text style={styles.prevButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          {step < 4 ? (
            <TouchableOpacity
              style={[styles.button, styles.nextButton, step === 1 && styles.fullWidthButton]}
              onPress={handleNextStep}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Submit for Verification</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {viewOnly && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.fullWidthButton, styles.closeViewButton]}
            onPress={onCancel}
          >
            <Text style={styles.closeViewButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 8,
  },
  stepDotActive: {
    backgroundColor: '#6B4EFF',
  },
  stepDotInactive: {
    backgroundColor: '#E0E0E0',
  },
  scrollContainer: {
    flex: 1,
  },
  formSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
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
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
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
  uploadButtonError: {
    borderColor: '#F44336',
  },
  uploadText: {
    marginLeft: 8,
    color: '#6B4EFF',
    fontSize: 16,
  },
  businessTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  businessTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
  },
  businessTypeButtonActive: {
    backgroundColor: '#6B4EFF',
  },
  businessTypeText: {
    color: '#666',
    fontSize: 14,
  },
  businessTypeTextActive: {
    color: '#FFFFFF',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#6B4EFF',
  },
  categoryText: {
    color: '#666',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthButton: {
    flex: 1,
  },
  prevButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#6B4EFF',
    marginLeft: 8,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#6B4EFF',
    marginLeft: 8,
  },
  prevButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: -4,
    marginBottom: 8,
  },
  reviewSection: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    paddingBottom: 16,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  reviewValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  termsText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  termsLink: {
    color: '#6B4EFF',
    textDecorationLine: 'underline',
  },
  termsContainer: {
    marginBottom: 16,
  },
  disclaimerContainer: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  documentHelper: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EDFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  securityText: {
    fontSize: 14,
    color: '#6B4EFF',
    marginLeft: 8,
    flex: 1,
  },
  readOnlyValue: {
    fontSize: 16,
    color: '#333',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  closeViewButton: {
    backgroundColor: '#F5F5F5',
  },
  closeViewButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SellerVerificationForm; 