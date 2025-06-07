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
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import BottomTabBar from '../../components/common/BottomTabBar';
import { uploadToS3 } from '../../utils/s3Upload';
import { createProduct } from '../../services/productService';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  inventory: string;
  images: string[];
}

interface AddProductProps {
  onChangeScreen: (screen: string) => void;
}

const AddProduct: React.FC<AddProductProps> = ({ onChangeScreen }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    category: '',
    inventory: '0',
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const pickImage = async () => {
    try {
      const options = {
        mediaType: 'photo' as MediaType,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      };

      launchImageLibrary(options, (response) => {
        if (response.didCancel || response.errorMessage) {
          console.log('Image picker cancelled or error:', response.errorMessage);
          return;
        }

        if (response.assets && response.assets[0]) {
          setUploadingImages(true);
          
          const selectedImage = response.assets[0];
          console.log('Selected image:', selectedImage.uri);
          
          // Upload to S3
          uploadToS3(
            {
              uri: selectedImage.uri || '',
              type: selectedImage.type || 'image/jpeg',
              name: `product-image-${Date.now()}.jpg`
            },
            'products'
          ).then((s3Url) => {
            console.log('Image uploaded to S3:', s3Url);
            
            // Add S3 URL to form data
            setFormData(prev => ({
              ...prev,
              images: [...prev.images, s3Url],
            }));
            
            Alert.alert('✅ Upload Successful', 'Image uploaded to S3 successfully!');
            setUploadingImages(false);
          }).catch((uploadError) => {
            console.error('S3 upload error:', uploadError);
            Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
            setUploadingImages(false);
          });
        }
      });
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
      setUploadingImages(false);
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

    const price = parseFloat(formData.price);
    const inventory = parseInt(formData.inventory) || 0;
    
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to add products');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating product with S3 images:', {
        name: formData.name,
        description: formData.description,
        price: price,
        category: formData.category,
        inventory: inventory,
        images: formData.images, // These are now S3 URLs!
      });
      
      // Create product using real service
      const newProduct = await createProduct({
        name: formData.name,
        description: formData.description,
        price: price,
        images: formData.images, // S3 URLs
        category: formData.category,
        inventory: inventory
      });
      
      if (newProduct) {
        Alert.alert(
          '🎉 Product Added Successfully!', 
          `${formData.name} has been added to your shop with images stored in S3.`,
          [
            {
              text: 'View Shop',
              onPress: () => onChangeScreen('localshop')
            }
          ]
        );
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          category: '',
          inventory: '0',
          images: [],
        });
      } else {
        throw new Error('Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => onChangeScreen('localshop')}
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
            <Text style={styles.label}>Initial Inventory</Text>
            <TextInput
              style={styles.input}
              value={formData.inventory}
              onChangeText={(text) => setFormData(prev => ({ ...prev, inventory: text }))}
              placeholder="Enter initial stock quantity"
              keyboardType="numeric"
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

        <BottomTabBar currentScreen="localshop" onChangeScreen={onChangeScreen} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
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