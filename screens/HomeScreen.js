import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  ActivityIndicator, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Snackbar } from 'react-native-paper';
import { FLICKR_API_KEY } from '@env';

const STORAGE_KEY = '@cached_images';

export default function HomeScreen() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  useEffect(() => {
    loadImages(true);
  }, []);

  const buildApiUrl = (pageNum) =>
    `https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&per_page=20&page=${pageNum}&api_key=${FLICKR_API_KEY}&format=json&nojsoncallback=1&extras=url_s`;

  const loadImages = async (reset = false) => {
    if (loading || loadingMore || (!hasMore && !reset)) return;

    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = reset ? 1 : page;
      const res = await fetch(buildApiUrl(currentPage));
      const json = await res.json();

      const newImages = json.photos.photo
        .filter((p) => p.url_s)
        .map((p) => ({
          id: `${p.id}_${p.secret}`,
          url: p.url_s,
        }));

      const updatedImages = reset ? newImages : [...images, ...newImages];

      if (reset) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newImages));
      }

      setImages(updatedImages);
      setPage(currentPage + 1);
      setHasMore(currentPage < json.photos.pages);
    } catch (err) {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) setImages(JSON.parse(cached));
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadImages(true);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="large" style={{ margin: 16 }} />;
  };

  const renderItem = useCallback(({ item }) => (
    <Image source={{ uri: item.url }} style={styles.image} />
  ), []);

  if (loading && !refreshing) {
    return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        numColumns={2}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No images found</Text>}
        onEndReached={() => loadImages(false)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Retry',
          onPress: () => loadImages(true),
        }}
      >
        Failed to load. Check your internet connection.
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  image: {
    width: '48%',
    height: 150,
    margin: '1%',
    borderRadius: 10,
    backgroundColor: '#ddd',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#555',
  },
});
