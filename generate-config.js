const fs = require('fs');

const scriptUrl = process.env.SCRIPT_URL;
const registrationUrl = process.env.REGISTRATION_URL;

if (!scriptUrl || !registrationUrl) {
  console.error('Missing SCRIPT_URL or REGISTRATION_URL environment variables');
  process.exit(1);
}

const configContent = `
const SCRIPT_URL = '${scriptUrl}';
const REGISTRATION_URL = '${registrationUrl}';
`;

fs.writeFileSync('./assets/config.js', configContent);

console.log('Successfully generated assets/config.js');
