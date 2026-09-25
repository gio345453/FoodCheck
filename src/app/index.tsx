import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Text>Il test della fotocamera va eseguito su iPhone.</Text>
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>FoodCheck Camera Test</Text>
        <Text style={styles.text}>
          Serve il permesso per utilizzare la fotocamera.
        </Text>

        <Button
          title="Concedi accesso alla fotocamera"
          onPress={requestPermission}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>FoodCheck Camera Test</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  camera: {
    flex: 1,
  },

  overlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  overlayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  center: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    gap: 20,
  },

  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },

  text: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});