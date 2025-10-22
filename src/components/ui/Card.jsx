import React from "react";

const Card = ({
  children,
  className = "",
  variant = "default",
  padding = "default",
  ...props
}) => {
  const baseClasses = "bg-white rounded-lg shadow-sm border border-gray-200";

  const variants = {
    default: "",
    elevated: "shadow-lg",
    outlined: "border-2",
  };

  const paddings = {
    none: "",
    sm: "p-3",
    default: "p-4",
    lg: "p-6",
    xl: "p-8",
  };

  const classes = `${baseClasses} ${variants[variant]} ${paddings[padding]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
