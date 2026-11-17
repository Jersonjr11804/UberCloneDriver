// AI-assisted: see docs/AI_LOG.md #6
import { StyleSheet } from 'react-native';

// Paleta propia (violeta + coral). Cambia los colores aquí y se actualiza toda la app.
export const colors = {
  primary: '#5B3FD9',
  primaryDark: '#4527B8',
  primarySoft: '#EEEAFD',
  accent: '#FF7A59',
  success: '#12A150',
  warning: '#B25E09',
  warningSoft: '#FFF4E5',
  error: '#D92D20',
  errorSoft: '#FEF0EE',
  border: '#E4E1F2',
  background: '#FFFFFF',
  surface: '#F5F4FB',
  text: '#1A1633',
  muted: '#6B6785',
  white: '#FFFFFF',
};

export const formStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 20 },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
