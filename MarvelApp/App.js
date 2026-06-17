/**
 * App.js
 * Punto de entrada de la aplicación.
 * Solo monta el navegador — toda la configuración vive en AppNavigator.
 */

import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}