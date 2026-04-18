import React, { useState } from 'react';
import './TextEditor.css'; // Make sure the path is correct!

const TextEditor = ({ onApply }) => {
  const [inputSpec, setInputSpec] = useState('');

  const handleInputChange = (event) => {
    setInputSpec(event.target.value);
  };

  const handleApplyClick = () => {
    if (onApply) {
      onApply(inputSpec);
    }
  };

  return (
    <div className="text-editor-container">
      <textarea
        placeholder="Enter rendering specification..."
        onChange={handleInputChange}
        value={inputSpec}
      />
      <button onClick={handleApplyClick} className="apply-button">
        Apply
      </button>
    </div>
  );
};

export default TextEditor;