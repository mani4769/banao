import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FLICKR_API_KEY } from '@env';

const API_URL = `https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&per_page=20&page=1&api_key=${FLICKR_API_KEY}&format=json&nojsoncallback=1&extras=url_s`;
const STORAGE_KEY = '@cached_images';

export default function HomeScreen() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) setImages(JSON.parse(cached));

      const res = await fetch(API_URL);
      const json = await res.json();
      const newImages = json.photos.photo.map(p => p.url_s);

      if (JSON.stringify(newImages) !== cached) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newImages));
        setImages(newImages);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not fetch images. Showing cached ones.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadImages();
    setRefreshing(false);
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => <Image source={{ uri: item }} style={styles.image} />}
        ListEmptyComponent={<Text>No images found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  image: { width: '48%', height: 150, margin: '1%' },
});
