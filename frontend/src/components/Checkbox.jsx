import { Checkbox } from "@chakra-ui/react";

const CustomCheckbox = ({ isChecked, onChange, label }) => {
  return (
    <Checkbox.Root isChecked={isChecked} onChange={(e) => onChange?.(e.target.checked)}>
      <Checkbox.HiddenInput />
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Label>{label}</Checkbox.Label>
    </Checkbox.Root>
  );
};

export default CustomCheckbox;
