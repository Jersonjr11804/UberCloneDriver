// AI-assisted: see docs/AI_LOG.md #1
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../styles/formStyles';
import { rememberImage } from '../services/imageService';

export default function ImageField({
  label,
  uri,
  onChange,
  onTouch,
  error,
  aspect = [1, 1],
  hint,
}) {
  const [permissionError, setPermissionError] = useState('');

  const pickImage = async (source) => {
    setPermissionError('');
    onTouch();

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setPermissionError('Necesitamos permiso de la cámara para tomar la foto');
        return;
      }
    }

    const options = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect, base64: true };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      const asset = result.assets[0];
      rememberImage(asset.uri, asset.base64); // para subirla a Cloudinary
      onChange(asset.uri);
    }
  };

  const shownError = error || permissionError;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={[styles.preview, shownError ? styles.previewError : null]}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholder}>Sin imagen</Text>
        )}
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.smallButton} onPress={() => pickImage('camera')}>
          <Text style={styles.smallButtonText}>Cámara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton} onPress={() => pickImage('gallery')}>
          <Text style={styles.smallButtonText}>Galería</Text>
        </TouchableOpacity>
      </View>
      {shownError ? <Text style={styles.error}>{shownError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  hint: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  preview: {
    height: 170,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewError: { borderColor: colors.error, backgroundColor: colors.errorSoft },
  image: { width: '100%', height: '100%' },
  placeholder: { color: colors.muted },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  smallButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  smallButtonText: { color: colors.text, fontWeight: '700' },
  error: { color: colors.error, fontSize: 12, marginTop: 4 },
});
