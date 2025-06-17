import React, { useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  ActivityIndicator, TextInput, TouchableOpacity
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { FLICKR_API_KEY } from '@env';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const searchImages = async (reset = false) => {
    if (!query.trim()) return;
    if (loadingMore || loading) return;
    if (!hasMore && !reset) return;

    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = reset ? 1 : page;
      const API_URL = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${FLICKR_API_KEY}&format=json&nojsoncallback=1&extras=url_s&text=${encodeURIComponent(query)}&page=${currentPage}&per_page=20`;

      const res = await fetch(API_URL);
      const json = await res.json();
      const newImages = json.photos.photo.map(p => p.url_s);

      if (reset) {
        setImages(newImages);
      } else {
        setImages(prev => [...prev, ...newImages]);
      }

      setHasMore(currentPage < json.photos.pages);
      setPage(currentPage + 1);
    } catch (error) {
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="large" style={{ margin: 16 }} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search images..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => searchImages(true)}
        />
        <TouchableOpacity style={styles.button} onPress={() => searchImages(true)}>
          <Text style={{ color: '#fff' }}>Search</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={images}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        renderItem={({ item }) => <Image source={{ uri: item }} style={styles.image} />}
        ListEmptyComponent={!loading && <Text>No images found</Text>}
        onEndReached={() => searchImages(false)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        action={{
          label: 'Retry',
          onPress: () => searchImages(true),
        }}
      >
        Network error. Retry.
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  searchBar: { flexDirection: 'row', marginBottom: 10 },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#ccc',
    borderRadius: 5, padding: 8, marginRight: 8
  },
  button: { backgroundColor: '#007bff', padding: 10, borderRadius: 5 },
  image: { width: '48%', height: 150, margin: '1%' },
});
