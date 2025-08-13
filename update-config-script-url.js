const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const configFilePath = path.join(__dirname, 'assets', 'config.js');

try {
  console.log('Deploying Google Apps Script and getting new URL...');
  const deployOutput = execSync('cd gas && clasp deploy', { encoding: 'utf-8' });
  console.log('clasp deploy output:', deployOutput);

  const match = deployOutput.match(/Deployed (AKfycb[a-zA-Z0-9_-]+) @(\d+)/);
  if (!match) {
    throw new Error('Could not extract script ID from clasp deploy output.');
  }

  const scriptId = match[1];
  const newScriptUrl = `https://script.google.com/macros/s/${scriptId}/exec`;

  console.log(`New SCRIPT_URL: ${newScriptUrl}`);

  let configContent = fs.readFileSync(configFilePath, 'utf-8');

  // Update SCRIPT_URL
  configContent = configContent.replace(
    /const SCRIPT_URL = '.*';/,
    `const SCRIPT_URL = '${newScriptUrl}';`
  );

  fs.writeFileSync(configFilePath, configContent);
  console.log('Successfully updated assets/config.js with the new SCRIPT_URL.');

} catch (error) {
  console.error('Error updating SCRIPT_URL:', error.message);
  process.exit(1);
}
