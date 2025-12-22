import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const ItemCard = ({
  id = null,
  name = "Producto",
  description = "",
  price = 0,
  imageKey = null,
  volume = "",
  isCold = true,
  onAddToCart ,
}) => {
  // // Fallback de imagen
  // const imageSource = image
  //   ? { uri: image }
  //   : require("../assets/no-image.png"); // opcional
  
  return (
    <View style={styles.card}>
      {/* Imagen */}
      <View style={styles.imageContainer}>
        <Image source={imageKey} style={styles.image} />

        {/* Badge */}
        <View
          style={[
            styles.badge,
            isCold ? styles.coldBadge : styles.hotBadge,
          ]}
        >
          <Text style={styles.badgeText}>
            {isCold ? "Fría" : "Caliente"}
          </Text>
        </View>
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name || "Sin nombre"}
        </Text>

        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <View>
            {volume ? (
              <Text style={styles.volume}>{volume}</Text>
            ) : null}

            <Text style={styles.price}>
              ${price ?? 0}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              onAddToCart({
                id,
                name,
                price,
              })
            }
            disabled={price == null}
          >
            <Text style={styles.addButtonText}>
              Agregar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ItemCard;

/* ================= ESTILOS ================= */

const styles = StyleSheet.create({
  card: {
    width: 260,
    height: 360,
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    margin: 10,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },

  imageContainer: {
    height: 160,
    backgroundColor: "#f2f2f2",
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  coldBadge: {
    backgroundColor: "#00aaff",
  },

  hotBadge: {
    backgroundColor: "#ff6b00",
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  content: {
    padding: 14,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
  },

  description: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  footer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  volume: {
    fontSize: 12,
    color: "#888",
  },

  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
  },

  addButton: {
    backgroundColor: "#ffc72c",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  addButtonText: {
    fontWeight: "bold",
    color: "#000",
  },
});
