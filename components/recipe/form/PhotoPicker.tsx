import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  ActionSheetIOS,
  Alert,
  type AlertButton,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/useTheme";

type Props = {
  photoUri: string | undefined;
  onChange: (photoUri: string | undefined) => void;
};

export function PhotoPicker({ photoUri, onChange }: Props) {
  const theme = useTheme();
  const { t } = useT();

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("photoPermissionTitle"), t("photoPermissionMessage"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  };

  const launchLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("photoPermissionTitle"), t("photoPermissionMessage"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  };

  const remove = () => onChange(undefined);

  const showActionSheet = () => {
    const hasPhoto = !!photoUri;

    if (Platform.OS === "ios") {
      const options = hasPhoto
        ? [t("takePhoto"), t("pickFromLibrary"), t("removePhoto"), t("cancel")]
        : [t("takePhoto"), t("pickFromLibrary"), t("cancel")];
      const cancelButtonIndex = options.length - 1;
      const destructiveButtonIndex = hasPhoto ? 2 : undefined;
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex, destructiveButtonIndex },
        (index) => {
          if (index === 0) launchCamera();
          else if (index === 1) launchLibrary();
          else if (hasPhoto && index === 2) remove();
        },
      );
      return;
    }

    const buttons: AlertButton[] = [
      { text: t("takePhoto"), onPress: launchCamera },
      { text: t("pickFromLibrary"), onPress: launchLibrary },
    ];
    if (hasPhoto) {
      buttons.push({
        text: t("removePhoto"),
        style: "destructive",
        onPress: remove,
      });
    }
    buttons.push({ text: t("cancel"), style: "cancel" });
    Alert.alert(t("addPhoto"), undefined, buttons);
  };

  return (
    <Pressable
      testID="photo-picker"
      accessibilityRole="button"
      accessibilityLabel={photoUri ? t("addPhoto") : t("addPhoto")}
      onPress={showActionSheet}
      style={[
        styles.frame,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {photoUri ? (
        <Image
          testID="photo-picker-image"
          source={{ uri: photoUri }}
          style={styles.image}
          contentFit="contain"
        />
      ) : (
        <View style={styles.placeholder}>
          <MaterialCommunityIcons
            name="baguette"
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
            {t("addPhoto")}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    aspectRatio: 2 / 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", gap: 6 },
  hint: { fontSize: 13 },
});
