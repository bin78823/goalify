import { View, Text, Pressable, StyleSheet } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
}: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === "primary" ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[styles.text, variant === "secondary" && styles.secondaryText]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: "#007AFF",
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryText: {
    color: "#007AFF",
  },
});
