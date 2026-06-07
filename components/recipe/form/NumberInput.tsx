import { useEffect, useState } from "react";
import { TextInput, type TextInputProps } from "react-native";

type Props = Omit<TextInputProps, "value" | "onChangeText" | "keyboardType"> & {
  value: number;
  onChangeNumber: (n: number) => void;
  testID?: string;
};

export function NumberInput({ value, onChangeNumber, ...rest }: Props) {
  const [raw, setRaw] = useState<string>(value > 0 ? String(value) : "");

  useEffect(() => {
    const fromRaw = raw === "" ? 0 : Number(raw);
    if (Number.isFinite(fromRaw) && fromRaw === value) return;
    setRaw(value > 0 ? String(value) : "");
  }, [value, raw]);

  return (
    <TextInput
      {...rest}
      value={raw}
      keyboardType="decimal-pad"
      onChangeText={(text) => {
        setRaw(text);
        if (text === "") {
          onChangeNumber(0);
          return;
        }
        const n = Number(text);
        if (Number.isFinite(n)) {
          onChangeNumber(n);
        }
      }}
    />
  );
}
