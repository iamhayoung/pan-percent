import { MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

type Props = {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  href?: React.ComponentProps<typeof Link>["href"];
};

export default function CircleButton({ href, icon }: Props) {
  const Wrap = href
    ? ({ children }: { children: React.ReactNode }) => (
        <Link href={href} asChild>
          {children}
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <Wrap>
      <Pressable style={styles.circleButton}>
        {/* TODO: Set color */}
        <MaterialIcons name={icon} size={24} color="white" />
      </Pressable>
    </Wrap>
  );
}

const styles = StyleSheet.create({
  circleButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black", // TODO: color
    borderRadius: 24,
  },
});
