import React from "react";

export interface IConfigOptionProps {
  title: string;
  subtitle: string;
  isActive: boolean;
  onClick: () => void;
}

const ConfigOption = ({
  title,
  subtitle,
  isActive,
  onClick,
}: IConfigOptionProps) => {
  if (isActive)
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex flex-row justify-between items-baseline px-3 py-4 bg-gray-700 rounded-lg"
      >
        <p className="text-sm font-semibold text-gray-100 text-left">{title}</p>
        <p className="text-xs font-normal text-gray-200 text-right">
          {subtitle}
        </p>
      </button>
    );

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-row justify-between items-baseline px-3 py-4 bg-white rounded-lg"
    >
      <p className="text-sm font-semibold text-gray-600 text-left">{title}</p>
      <p className="text-xs font-normal text-gray-500 text-right">{subtitle}</p>
    </button>
  );
};

export default ConfigOption;