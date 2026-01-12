import { RadioGroup, Stack, For } from "@chakra-ui/react";

function RadioButtons({ items }) {
  
  return (
    <RadioGroup.Root defaultValue="1">
      <Stack>
        <For each={items}>
          {(item) => (
            <RadioGroup.Item key={item.value} value={item.value}>
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator />
              <RadioGroup.ItemText>{item.label}</RadioGroup.ItemText>
            </RadioGroup.Item>
          )}
        </For>
      </Stack>
    </RadioGroup.Root>
  );
}

export default RadioButtons;