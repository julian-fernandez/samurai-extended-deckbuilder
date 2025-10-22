import React from "react";

const Input = ({ label, error, className = "", ...props }) => {
  const inputClasses = `
    w-full px-3 py-2 border border-gray-300 rounded-lg 
    focus:ring-2 focus:ring-blue-500 focus:border-transparent 
    shadow-sm transition-all duration-200 hover:shadow-md
    ${error ? "border-red-500 focus:ring-red-500" : ""}
    ${className}
  `.trim();

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
