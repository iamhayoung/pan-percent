import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Pressable, StyleSheet } from "react-native";

type Props = {
  attachedImage?: string;
  setAttachedImage: (uri?: string) => void;
};

export default function Thumbnail({ attachedImage, setAttachedImage }: Props) {
  const pickImageAsync = async () => {
    console.log("pick image");
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
    });

    if (!result.canceled) {
      setAttachedImage(result.assets[0].uri);
    }
  };

  return (
    <Pressable style={styles.container} onPress={pickImageAsync}>
      {attachedImage ? (
        <>
          <FontAwesome6
            name="xmark"
            size={18}
            style={styles.iconDelete}
            onPress={() => setAttachedImage(undefined)}
          />
          <Image source={{ uri: attachedImage }} style={styles.image} />
        </>
      ) : (
        <MaterialCommunityIcons name="camera-plus" size={24} color="black" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e2e2e2", // TODO: color
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "contain",
  },
  iconDelete: {
    position: "absolute",
    top: 6,
    right: 10,
    color: "red", // TODO: color
    zIndex: 1,
  },
});
