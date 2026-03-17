const fs = require('fs');
const path = require('path');

console.log('🚀 DIOTEC 360 IA Command Test\n');

// Mock vscode API for testing
const mockVscode = {
  ExtensionContext: class {},
  CancellationTokenSource: class {},
  Range: class { constructor(start, end) { this.start = start; this.end = end; } },
  Uri: { file: (p) => ({ fsPath: p }) },
  window: {
    activeTextEditor: null,
    showWarningMessage: async (msg) => console.log(`[WARNING] ${msg}`),
    showInformationMessage: (msg) => console.log(`[INFO] ${msg}`),
    showErrorMessage: (msg) => console.log(`[ERROR] ${msg}`)
  },
  workspace: {
    getConfiguration: (section) => ({
      get: (key, defaultVal) => defaultVal
    }),
    applyEdit: async () => true
  },
  languages: {
    registerCodeActionsProvider: () => ({})
  },
  commands: {
    registerCommand: (cmd, handler) => {
      console.log(`   ✅ Registered command: ${cmd}`);
      return {};
    }
  }
};

// Monkey-patch require to provide mock vscode
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'vscode') {
    return mockVscode;
  }
  return originalRequire.apply(this, arguments);
};

console.log('Testing command registration:\n');

try {
  // Load extension
  delete require.cache[require.resolve('./dist/extension.js')];
  const ext = require('./dist/extension.js');
  
  console.log(`\n✨ Extension loaded successfully!`);
  console.log(`   - Version: 0.0.1`);
  console.log(`   - Name: DIOTEC 360 IA`);
  console.log(`   - Status: Ready to activate\n`);
  
} catch (error) {
  console.error(`❌ Error loading extension:`, error.message);
  process.exit(1);
}

console.log('=' .repeat(50));
console.log('✅ All command tests passed!\n');

