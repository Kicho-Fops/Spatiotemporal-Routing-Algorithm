import { NumberInput, Text } from "@chakra-ui/react"


function NumberInputWrapper({ onChange }) {


  return (

    <>
    <Text textStyle="sm">Number of Paths to Calculate</Text>
    <NumberInput.Root defaultValue="3"  onValueChange={(details) => {
          // Send the numeric value back to the parent/redux
          // console.log("NumberInput value changed:", details);
          onChange(details.valueAsNumber); 
        }}>
      
      {/* <NumberInput.Label /> */}
      {/* <NumberInput.ValueText /> */}
      <NumberInput.Control>
        <NumberInput.IncrementTrigger />
        <NumberInput.DecrementTrigger />
      </NumberInput.Control>
      <NumberInput.Scrubber />
      <NumberInput.Input />
    </NumberInput.Root>
    
    </>
  )
}

export default NumberInputWrapper