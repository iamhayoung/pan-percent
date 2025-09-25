import CircleButton from "@/components/CircleButton";
import { StyleSheet, Text, View } from "react-native";

export default function RecipesScreen() {
  return (
    <View style={styles.container}>
      <Text>recipe</Text>

      <View style={styles.circleButtonPosition}>
        <CircleButton icon="add" href="/recipe/register" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  circleButtonPosition: {
    position: "absolute",
    bottom: 24,
    right: 24,
  },
});
