import { RadioGroup, Stack, For } from "@chakra-ui/react";

function RadioButtons({ value, items, onSelect }) {
  
  return (
    <RadioGroup.Root value={value} onChange={onSelect} defaultValue="1">
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