import React, { useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { logError, getFallbackMediaUrl } from '../utils/errorHandler';

interface VideoPlayerProps {
  uri: string;
  style?: any;
  shouldPlay?: boolean;
  isLooping?: boolean;
  isMuted?: boolean;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  onPlaybackStatusUpdate?: (status: any) => void;
  onLoadComplete?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  uri,
  style,
  shouldPlay = true,
  isLooping = true,
  isMuted = false,
  resizeMode = 'contain',
  onPlaybackStatusUpdate,
  onLoadComplete,
}) => {
  const videoRef = useRef<VideoRef>(null);
  const [videoUrl, setVideoUrl] = useState(uri);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Handle video loading complete
  const handleLoad = (data: any) => {
    setIsLoading(false);
    setHasLoaded(true);
    if (onLoadComplete) {
      onLoadComplete();
    }
    
    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(data);
    }
  };
  
  // Handle video errors
  const handleVideoError = (error: any) => {
    logError(error, 'VideoPlayer');
    
    // Track error count to prevent infinite retry loops
    setErrorCount(prev => prev + 1);
    
    if (errorCount < 3) {
      // Try to refresh the URL with a cache buster
      const cacheBuster = `?cb=${Date.now()}`;
      const newUrl = uri.includes('?') 
        ? `${uri}&cb=${Date.now()}`
        : `${uri}${cacheBuster}`;
        
      console.log(`Video error, trying with cache buster: ${newUrl}`);
      setVideoUrl(newUrl);
    } else {
      // After multiple retries, use a fallback
      const fallbackUrl = getFallbackMediaUrl('video');
      setVideoUrl(fallbackUrl);
      setIsLoading(false);
    }
  };
  
  // Convert prop resizeMode to react-native-video format
  const getRNVResizeMode = () => {
    switch (resizeMode) {
      case 'contain':
        return 'contain';
      case 'cover':
        return 'cover';
      case 'stretch':
        return 'stretch';
      default:
        return 'contain';
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      {isLoading && !hasLoaded && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
      
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.video}
        resizeMode={getRNVResizeMode()}
        repeat={isLooping}
        muted={isMuted}
        paused={!shouldPlay}
        onLoad={handleLoad}
        onError={handleVideoError}
        onProgress={onPlaybackStatusUpdate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default VideoPlayer; 