import React, { forwardRef } from "react";

const SearchInput = forwardRef(function SearchInput(
  { value, onChange, onClose },
  ref
) {
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      placeholder="검색하려면 /"
      style={{
        width: "100%",
        padding: 8,
        borderRadius: 6,
        border: "1px solid #d1d5db",
      }}
    />
  );
});

export default SearchInput;
