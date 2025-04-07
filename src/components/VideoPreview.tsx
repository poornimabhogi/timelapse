import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  Modal,
} from 'react-native';
import Video from 'react-native-video';

const { width, height } = Dimensions.get('window');

interface VideoPreviewProps {
  visible: boolean;
  videoUri: string;
  onClose: () => void;
  onProcessVideo: (processedUri: string, duration: number) => void;
  maxDuration?: number; // Max duration in seconds
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  visible,
  videoUri,
  onClose,
  onProcessVideo,
  maxDuration = 60, // Default max is 60 seconds (1 minute)
}) => {
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTrim, setStartTrim] = useState(0);
  const [endTrim, setEndTrim] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleLoad = (data: any) => {
    console.log('Video loaded:', data);
    setIsLoading(false);
    setDuration(data.duration);
    setEndTrim(Math.min(data.duration, maxDuration));
  };

  const handleProgress = (data: any) => {
    setCurrentTime(data.currentTime);
  };

  const handleError = (error: any) => {
    console.error('Video loading error:', error);
    setIsLoading(false);
  };

  const handleStartTrimChange = (value: number) => {
    const newStart = Math.max(0, Math.min(value, endTrim - 5));
    setStartTrim(newStart);
  };

  const handleEndTrimChange = (value: number) => {
    const newEnd = Math.max(startTrim + 5, Math.min(value, duration));
    setEndTrim(newEnd);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleProcessVideo = async () => {
    try {
      setProcessing(true);
      // In a real implementation, we would use a native module to trim the video
      // For this example, we'll simulate video processing
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll just return the original URI
      // In a real app, this would return a new URI for the trimmed video
      const trimmedDuration = endTrim - startTrim;
      onProcessVideo(videoUri, trimmedDuration);
      
      setProcessing(false);
    } catch (error) {
      console.error('Error processing video:', error);
      setProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Trim Video</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.videoContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6B4EFF" />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
          
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode="contain"
            repeat
            onLoad={handleLoad}
            onProgress={handleProgress}
            onError={handleError}
            controls
          />
        </View>

        <View style={styles.trimInfo}>
          <Text style={styles.trimInfoText}>
            Selected duration: {formatTime(endTrim - startTrim)} 
            {maxDuration && duration > maxDuration && 
              ` (max: ${formatTime(maxDuration)})`}
          </Text>
        </View>

        <View style={styles.sliderContainer}>
          {/* In a real implementation, add custom slider components here */}
          <Text style={styles.rangeLabel}>
            Start: {formatTime(startTrim)} - End: {formatTime(endTrim)}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onClose}
            disabled={processing}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.processButton, processing && styles.disabledButton]} 
            onPress={handleProcessVideo}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.processButtonText}>
                {duration > maxDuration ? 'Trim & Post' : 'Post Video'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  videoContainer: {
    width: width,
    height: width * 0.75, // 4:3 aspect ratio
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 14,
  },
  trimInfo: {
    padding: 16,
    alignItems: 'center',
  },
  trimInfoText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  sliderContainer: {
    padding: 16,
  },
  rangeLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  processButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#6B4EFF',
  },
  processButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default VideoPreview; 