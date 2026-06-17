/**
 * MarcaScreen.js — Pantalla de detalle de marca
 *
 * Muestra las secciones y productos de una marca específica.
 * Permite filtrar por sección y activar vista de ofertas.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute } from '@react-navigation/native';

import ItemCard from '../../components/Common/ItemCard';
import { getBrandColors } from '../../constants/colors';

// ─── Constantes locales ───────────────────────────────────────────────────────

const TODAS = 'TODAS';
const OFERTA_FLAG = 1; // valor que indica que un item está en oferta

// ─── Custom hook ──────────────────────────────────────────────────────────────

/**
 * useMarcaScreen
 * Encapsula el estado y la lógica de filtrado de la pantalla.
 * Recibe marcaData directamente para mantener el hook simple y testeable.
 */
const useMarcaScreen = (marcaData) => {
  const [selectedSection, setSelectedSection] = useState(TODAS);
  const [ofertasActivas, setOfertasActivas]   = useState(false);
  const colorAnim = useRef(new Animated.Value(0)).current;

  // Lista única de secciones disponibles
  const allSections = useMemo(
    () => [TODAS, ...new Set(marcaData.map((s) => s.section))],
    [marcaData]
  );

  // Datos filtrados según sección y toggle de ofertas
  const filteredData = useMemo(() => {
    let result =
      selectedSection === TODAS
        ? marcaData
        : marcaData.filter((s) => s.section === selectedSection);

    if (ofertasActivas) {
      result = result
        .map((sec) => {
          const ofertaItems = sec.items.filter((item) => item.OFERTA === OFERTA_FLAG);
          return { ...sec, items: ofertaItems, ofertas: ofertaItems.length };
        })
        .filter((sec) => sec.items.length > 0);
    }

    return result;
  }, [marcaData, selectedSection, ofertasActivas]);

  // Total de ofertas visibles
  const totalOfertas = useMemo(
    () => filteredData.reduce((acc, sec) => acc + (sec.ofertas ?? 0), 0),
    [filteredData]
  );

  // Animación del botón de ofertas
  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: ofertasActivas ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [ofertasActivas]);

  const ofertaBtnBg = colorAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['#a5a5a5b0', '#ffffff'],
  });

  return {
    allSections,
    selectedSection,
    setSelectedSection,
    ofertasActivas,
    toggleOfertas: () => setOfertasActivas((v) => !v),
    filteredData,
    totalOfertas,
    ofertaBtnBg,
  };
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/**
 * SectionPicker
 * Selector de sección.
 */
const SectionPicker = ({ sections, selected, onValueChange }) => (
  <Picker
    selectedValue={selected}
    onValueChange={onValueChange}
    style={styles.picker}
  >
    {sections.map((section) => (
      <Picker.Item key={section} label={section} value={section} />
    ))}
  </Picker>
);

/**
 * OfertasToggle
 * Botón animado que muestra el total de ofertas y activa el filtro.
 */
const OfertasToggle = ({ total, onPress, bgColor }) => (
  <TouchableOpacity onPress={onPress}>
    <Animated.View style={[styles.ofertasBtn, { backgroundColor: bgColor }]}>
      <Animated.Text style={styles.ofertasBtnText}>
        Ofertas: {total}
      </Animated.Text>
    </Animated.View>
  </TouchableOpacity>
);

/**
 * SectionBlock
 * Renderiza el título de sección y sus items.
 */
const SectionBlock = ({ sec, marcaName, brandColor }) => (
  <View style={styles.sectionBlock}>
    <Text style={[styles.sectionTitle, { color: brandColor.background }]}>
      {sec.section}
    </Text>

    {sec.items.map((item) => (
      <ItemCard
        key={item.CODIGO}
        item={item}
        textColor="black"
        marca={marcaName}
        backgroundColor={brandColor.background}
      >
        {item.MAQUINAS}
      </ItemCard>
    ))}
  </View>
);

// ─── Pantalla principal ───────────────────────────────────────────────────────

const MarcaScreen = () => {
  const route                      = useRoute();
  const { marcaName, marcaData }   = route.params;
  const brandColor                 = getBrandColors(marcaName);

  const {
    allSections,
    selectedSection,
    setSelectedSection,
    toggleOfertas,
    filteredData,
    totalOfertas,
    ofertaBtnBg,
  } = useMarcaScreen(marcaData);

  return (
    <View style={[styles.container, { backgroundColor: brandColor.background }]}>
      <Text style={[styles.brandTitle, { color: brandColor.text }]}>
        {marcaName}
      </Text>

      {/* Controles: selector de sección + toggle de ofertas */}
      <View style={styles.controls}>
        <SectionPicker
          sections={allSections}
          selected={selectedSection}
          onValueChange={setSelectedSection}
        />
        <OfertasToggle
          total={totalOfertas}
          onPress={toggleOfertas}
          bgColor={ofertaBtnBg}
        />
      </View>

      {/* Listado de secciones con sus items */}
      <ScrollView>
        {filteredData.map((sec, i) => (
          <SectionBlock
            key={`${sec.section}-${i}`}
            sec={sec}
            marcaName={marcaName}
            brandColor={brandColor}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default MarcaScreen;

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 8,
  },

  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },

  picker: {
    width: '40%',
    backgroundColor: 'white',
    color: 'black',
  },

  ofertasBtn: {
    padding: 10,
    borderRadius: 8,
  },

  ofertasBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },

  sectionBlock: {
    marginBottom: 15,
    backgroundColor: 'white',
  },

  sectionTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});