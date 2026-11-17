// AI-assisted: see docs/AI_LOG.md #1
import React, { useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import FormField from '../../components/FormField';
import SelectField from '../../components/SelectField';
import ImageField from '../../components/ImageField';
import StepIndicator from '../../components/StepIndicator';
import { useRegistration } from '../../context/RegistrationContext';
import { VEHICLE_FIELDS } from '../../utils/validators';
import { CATEGORIES, VEHICLE_COLORS } from '../../constants/options';
import { formStyles } from '../../styles/formStyles';

export default function VehicleScreen({ navigation }) {
  const { data, visibleErrors, isVehicleValid, updateField, touchField, touchFields } =
    useRegistration();

  const handleNext = useCallback(() => {
    touchFields(VEHICLE_FIELDS);
    if (isVehicleValid) navigation.navigate('Documentos');
  }, [touchFields, isVehicleValid, navigation]);

  return (
    <ScrollView
      style={formStyles.screen}
      contentContainerStyle={formStyles.container}
      keyboardShouldPersistTaps="handled"
    >
      <StepIndicator current={2} />
      <Text style={formStyles.title}>Vehículo</Text>
      <Text style={formStyles.subtitle}>Todos los campos son obligatorios</Text>

      <SelectField
        label="Categoría"
        value={data.category}
        options={CATEGORIES}
        onChange={(value) => {
          updateField('category', value);
          touchField('category');
        }}
        error={visibleErrors.category}
      />

      <FormField
        label="Placa"
        value={data.plate}
        onChangeText={(text) => updateField('plate', text.toUpperCase())}
        onBlur={() => touchField('plate')}
        error={visibleErrors.plate}
        placeholder="ABC123"
        maxLength={6}
        autoCapitalize="characters"
      />

      <FormField
        label="Marca"
        value={data.brand}
        onChangeText={(text) => updateField('brand', text)}
        onBlur={() => touchField('brand')}
        error={visibleErrors.brand}
        placeholder="Ej: Renault"
        maxLength={30}
        autoCapitalize="words"
      />

      <FormField
        label="Modelo"
        value={data.model}
        onChangeText={(text) => updateField('model', text)}
        onBlur={() => touchField('model')}
        error={visibleErrors.model}
        placeholder="Ej: Logan"
        maxLength={30}
        autoCapitalize="words"
      />

      <FormField
        label="Año"
        value={data.year}
        onChangeText={(text) => updateField('year', text.replace(/\D/g, ''))}
        onBlur={() => touchField('year')}
        error={visibleErrors.year}
        placeholder="Ej: 2020"
        keyboardType="numeric"
        maxLength={4}
      />

      <SelectField
        label="Color"
        value={data.color}
        options={VEHICLE_COLORS}
        onChange={(value) => {
          updateField('color', value);
          touchField('color');
        }}
        error={visibleErrors.color}
      />

      <FormField
        label="Capacidad de pasajeros"
        value={data.capacity}
        onChangeText={(text) => updateField('capacity', text.replace(/\D/g, ''))}
        onBlur={() => touchField('capacity')}
        error={visibleErrors.capacity}
        placeholder={data.category === 'xl' ? 'Mínimo 6 para XL' : 'Ej: 4'}
        keyboardType="numeric"
        maxLength={2}
      />

      <ImageField
        label="Foto del vehículo"
        hint="Debe verse la placa"
        uri={data.vehiclePhoto}
        onChange={(uri) => updateField('vehiclePhoto', uri)}
        onTouch={() => touchField('vehiclePhoto')}
        error={visibleErrors.vehiclePhoto}
        aspect={[4, 3]}
      />

      <TouchableOpacity style={formStyles.button} onPress={handleNext}>
        <Text style={formStyles.buttonText}>Siguiente</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
