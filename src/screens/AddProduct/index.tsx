import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { generateClient } from 'aws-amplify/api';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  images: string[];
}

const AddProduct: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    category: '',
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const client = generateClient();

  const pickImage = async () => {
    try {
      // Mock image picking functionality
      Alert.alert('Image Picker', 'This would open the image picker');
      // For demo purposes, add a placeholder image
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, 'https://via.placeholder.com/100'],
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    // Validate form data
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.images.length === 0) {
      Alert.alert('Error', 'Please add at least one product image');
      return;
    }

    setLoading(true);
    try {
      // Mock API call to create product
      console.log('Creating product:', {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        images: formData.images,
        sellerId: user ? 'current-user' : 'unknown',
      });
      
      // Simulate API delay
      setTimeout(() => {
        Alert.alert('Success', 'Product added successfully');
        navigation.goBack();
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to add product');
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={{fontSize: 24}}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add New Product</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter product name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Enter product description"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price *</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
            placeholder="Enter price"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
            placeholder="Enter product category"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Images *</Text>
          <View style={styles.imageList}>
            {formData.images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={{color: '#FFFFFF', fontSize: 16}}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {formData.images.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImage}
              >
                <Text style={{fontSize: 24, color: '#6B4EFF'}}>+</Text>
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding Product...' : 'Add Product'}
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
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6B4EFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    marginTop: 4,
    color: '#6B4EFF',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: '#6B4EFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddProduct; 