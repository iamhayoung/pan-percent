import Thumbnail from "@/components/recipe/register/Thumbnail";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | undefined>();

  return (
    <View>
      <Thumbnail
        attachedImage={attachedImage}
        setAttachedImage={setAttachedImage}
      />

      <Text>レシピの名前</Text>
      <TextInput
        placeholder="塩パン"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor={"#b2b2b2"} // TODO: color
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#555", // TODO: color
    borderRadius: 6,
    backgroundColor: "white", // TODO: color
  },
});
