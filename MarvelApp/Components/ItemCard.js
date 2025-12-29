// ItemCard.js
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

const ItemCard = ({
  id,
  name,
  precio1,
  precio2,
  imageKey,
  usandoPrecio2 = false,
  onSelectPrecio,
  onAddToCart,
  width = 260,
  height = 360,
}) => {
  const precioFinal =
    usandoPrecio2 && typeof precio2 === "number"
      ? precio2
      : Number(precio1 ?? 0);

  return (
    <View style={[styles.card, { width, height }]}>
      <Image source={imageKey} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>

        {/* PRECIOS */}
        <View style={styles.prices}>
          <TouchableOpacity
            style={[
              styles.priceBox,
              !usandoPrecio2 && styles.priceActive,
            ]}
            onPress={() => onSelectPrecio(false)}
          >
            <Text style={styles.priceLabel}>Precio 1</Text>
            <Text style={styles.priceValue}>
              ${Number(precio1 ?? 0).toLocaleString("es-AR")}
            </Text>
          </TouchableOpacity>

          {typeof precio2 === "number" && (
            <TouchableOpacity
              style={[
                styles.priceBox,
                usandoPrecio2 && styles.priceActive,
              ]}
              onPress={() => onSelectPrecio(true)}
            >
              <Text style={styles.priceLabel}>Precio 2</Text>
              <Text style={styles.priceValue}>
                ${precio2.toLocaleString("es-AR")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* AGREGAR */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onAddToCart(precioFinal)}
        >
          <Text style={styles.addText}>
            🛒 Agregar · ${precioFinal.toLocaleString("es-AR")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ItemCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    elevation: 4,
  },
  image: {
    height: 160,
    width: "100%",
    resizeMode: "cover",
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  prices: {
    flexDirection: "row",
    marginTop: 10,
  },
  priceBox: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 12,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  priceActive: {
    backgroundColor: "#C8E6C9",
  },
  priceLabel: {
    fontSize: 12,
    color: "#555",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#FFC72C",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 12,
  },
  addText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
