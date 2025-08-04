import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';

const EjemploComponents = () => {
  const items = Array.from({ length: 50 }, (_, i) => `Ítem número ${i + 1}`);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.header}>Ejemplos de Componentes</Text>
        {items.map((item, index) => (
          <View key={index} style={styles.itemBox}>
            <Text>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  itemBox: {
    height: 60,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EjemploComponents;
