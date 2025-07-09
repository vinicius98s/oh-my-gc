import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

type Props = {
  defaultValue?: number;
  min?: number;
  max?: number;
  onChangeValue?: (value: number) => void;
};

export default function NumberInput({
  defaultValue = 0,
  min = 0,
  max = 100,
  onChangeValue,
}: Props) {
  const [value, setValue] = useState(defaultValue);

  const increment = () => {
    if (value < max) {
      setValue(value + 1);
    }
  };

  const decrement = () => {
    if (value > min) {
      setValue(value - 1);
    }
  };

  useEffect(() => {
    onChangeValue?.(value);
  }, [value]);

  return (
    <div className="inline-flex border border-blue rounded overflow-hidden">
      <input
        type="number"
        className="w-16 px-2 py-1 text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={value}
        readOnly
      />
      <div className="flex flex-col border-l border-blue">
        <button
          className="flex-1 px-2 cursor-pointer hover:bg-dark-blue disabled:opacity-50 hover:disabled:bg-transparent disabled:cursor-default"
          disabled={value === max}
          onClick={increment}
        >
          <ChevronUp className="w-3 h-3 text-blue" />
        </button>
        <button
          className="flex-1 px-2 cursor-pointer hover:bg-dark-blue disabled:opacity-50 hover:disabled:bg-transparent disabled:cursor-default"
          disabled={value === min}
          onClick={decrement}
        >
          <ChevronDown className="w-3 h-3 text-blue" />
        </button>
      </div>
    </div>
  );
}
