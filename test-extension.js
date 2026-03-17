const fs = require('fs');
const path = require('path');

console.log('🧪 DIOTEC 360 IA Extension Test Suite\n');
console.log('=' .repeat(60));

// Test 1: Package.json validation
console.log('\n1️⃣  Testing Package.json...');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const requiredCommands = [
  'diotec360.generate',
  'diotec360.explain',
  'diotec360.refactor',
  'diotec360.chat',
  'diotec360.openMemory',
  'diotec360.configureApiKey',
  'diotec360.configureAnthropicApiKey',
  'diotec360.buyCredits',
  'diotec360.viewBalance'
];

console.log(`   ✅ Name: ${packageJson.name}`);
console.log(`   ✅ Display: ${packageJson.displayName}`);
console.log(`   ✅ Version: ${packageJson.version}`);
console.log(`   ✅ Main entry: ${packageJson.main}`);

// Test 2: Check all commands are registered
console.log('\n2️⃣  Testing Command Registration...');
let commandCount = 0;
const registeredCommands = [];
packageJson.contributes.commands.forEach(cmd => {
  registeredCommands.push(cmd.command);
  commandCount++;
});

requiredCommands.forEach(cmd => {
  if (registeredCommands.includes(cmd)) {
    console.log(`   ✅ ${cmd}`);
  } else {
    console.log(`   ❌ MISSING: ${cmd}`);
  }
});

console.log(`\n   Total commands registered: ${commandCount}`);

// Test 3: Check menus
console.log('\n3️⃣  Testing Menu Structure...');
const menus = packageJson.contributes.menus;
console.log(`   ✅ Submenu defined: ${menus['diotec360.submenu'] ? 'YES' : 'NO'}`);
console.log(`   ✅ Editor context menu: ${menus['editor/context'] ? 'YES' : 'NO'}`);
console.log(`   ✅ Editor title menu: ${menus['editor/title'] ? 'YES' : 'NO'}`);

// Test 4: Check configuration
console.log('\n4️⃣  Testing Configuration Schema...');
const config = packageJson.contributes.configuration;
const requiredSettings = [
  'angoIA.enabled',
  'angoIA.moe.enabled',
  'angoIA.provider',
  'angoIA.memory.enabled',
  'angoIA.mining.enabled'
];

let settingsCount = 0;
requiredSettings.forEach(setting => {
  if (config.properties[setting]) {
    console.log(`   ✅ ${setting}`);
    settingsCount++;
  } else {
    console.log(`   ⚠️  Missing: ${setting}`);
  }
});

console.log(`\n   Total settings: ${Object.keys(config.properties).length}`);

// Test 5: Check dist files
console.log('\n5️⃣  Testing Distribution Files...');
const distPath = './dist';
if (fs.existsSync(distPath)) {
  const distFiles = fs.readdirSync(distPath, { recursive: true });
  console.log(`   ✅ dist/ directory exists`);
  console.log(`   ✅ Total files: ${distFiles.length}`);
  
  if (fs.existsSync('./dist/extension.js')) {
    console.log(`   ✅ extension.js compiled`);
  }
} else {
  console.log(`   ❌ dist/ directory not found`);
}

// Test 6: Check key source files
console.log('\n6️⃣  Testing Source Files...');
const sourceFiles = [
  'src/extension.ts',
  'src/commands/generate.ts',
  'src/commands/explain.ts',
  'src/commands/refactor.ts',
  'src/commands/chat.ts',
  'src/memory/store.ts',
  'src/lattice/logicMiner.ts'
];

sourceFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ MISSING: ${file}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('✨ Test Suite Complete!\n');

