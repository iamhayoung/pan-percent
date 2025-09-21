import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function RecipesScreen() {
  return (
    <View>
      <Text>recipe</Text>
      <Link href="/recipe/register">Go to register</Link>
    </View>
  );
}
