import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ value, onChange, language = 'javascript' }) => {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <Editor
        height="400px"
        language={language}
        value={value}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          automaticLayout: true,
          readOnly: false,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;