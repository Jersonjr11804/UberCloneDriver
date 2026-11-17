// AI-assisted: see docs/AI_LOG.md #1
import React, { useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import FormField from '../../components/FormField';
import SelectField from '../../components/SelectField';
import DateField from '../../components/DateField';
import ImageField from '../../components/ImageField';
import StepIndicator from '../../components/StepIndicator';
import { useRegistration } from '../../context/RegistrationContext';
import { PERSONAL_FIELDS } from '../../utils/validators';
import { GENDERS, LANGUAGES } from '../../constants/options';
import { formStyles } from '../../styles/formStyles';

export default function PersonalDataScreen({ navigation }) {
  const { data, visibleErrors, isPersonalValid, updateField, touchField, touchFields } =
    useRegistration();

  const handleNext = useCallback(() => {
    touchFields(PERSONAL_FIELDS); // muestra todos los errores pendientes
    if (isPersonalValid) navigation.navigate('Vehiculo');
  }, [touchFields, isPersonalValid, navigation]);

  return (
    <ScrollView
      style={formStyles.screen}
      contentContainerStyle={formStyles.container}
      keyboardShouldPersistTaps="handled"
    >
      <StepIndicator current={1} />
      <Text style={formStyles.title}>Datos personales</Text>
      <Text style={formStyles.subtitle}>Todos los campos son obligatorios</Text>

      <ImageField
        label="Foto de perfil"
        uri={data.profilePhoto}
        onChange={(uri) => updateField('profilePhoto', uri)}
        onTouch={() => touchField('profilePhoto')}
        error={visibleErrors.profilePhoto}
      />

      <FormField
        label="Nombre completo"
        value={data.fullName}
        onChangeText={(text) => updateField('fullName', text)}
        onBlur={() => touchField('fullName')}
        error={visibleErrors.fullName}
        placeholder="Ej: Juan Pérez"
        maxLength={50}
        autoCapitalize="words"
      />

      <FormField
        label="Documento de identidad"
        value={data.documentId}
        onChangeText={(text) => updateField('documentId', text.replace(/\D/g, ''))}
        onBlur={() => touchField('documentId')}
        error={visibleErrors.documentId}
        placeholder="6 a 10 dígitos"
        keyboardType="numeric"
        maxLength={10}
      />

      <FormField
        label="Número de celular"
        value={data.phone}
        onChangeText={(text) => updateField('phone', text.replace(/\D/g, ''))}
        onBlur={() => touchField('phone')}
        error={visibleErrors.phone}
        placeholder="10 dígitos"
        keyboardType="phone-pad"
        maxLength={10}
      />

      <DateField
        label="Fecha de nacimiento"
        value={data.birthDate}
        onChange={(date) => updateField('birthDate', date)}
        onTouch={() => touchField('birthDate')}
        error={visibleErrors.birthDate}
      />

      <SelectField
        label="Género"
        value={data.gender}
        options={GENDERS}
        onChange={(value) => {
          updateField('gender', value);
          touchField('gender');
        }}
        error={visibleErrors.gender}
      />

      <FormField
        label="Correo electrónico"
        value={data.email}
        onChangeText={(text) => updateField('email', text)}
        onBlur={() => touchField('email')}
        error={visibleErrors.email}
        placeholder="nombre@dominio.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <SelectField
        label="Idioma"
        value={data.language}
        options={LANGUAGES}
        onChange={(value) => {
          updateField('language', value);
          touchField('language');
        }}
        error={visibleErrors.language}
      />

      <TouchableOpacity style={formStyles.button} onPress={handleNext}>
        <Text style={formStyles.buttonText}>Siguiente</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
