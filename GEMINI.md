# GEMINI Project Analysis

## Project Overview

This project is a serverless system for managing and issuing webinar participation certificates. It uses a static HTML/CSS/JS frontend and a Google Apps Script backend that interacts with a Google Sheet.

**Key Technologies:**

*   **Frontend:** HTML, CSS, JavaScript
    *   **Libraries:** CryptoJS (for hashing), QRCode.js (for QR codes), jsPDF & html2canvas (for PDF generation)
*   **Backend:** Google Apps Script (`code.gs`)
*   **Database:** Google Sheets
*   **Deployment:** The frontend is designed for static hosting services like Cloudflare Pages or GitHub Pages. The `wrangler.jsonc` file indicates a Cloudflare Pages deployment.

**Architecture:**

The system is composed of two main parts:

1.  **Static Frontend:** A set of HTML pages (`index.html`, `verificar.html`, `cert.html`, `buscar.html`) that provide the user interface for registering, searching for, and verifying certificates.
2.  **Serverless Backend:** A Google Apps Script that acts as a JSON API. It handles the business logic of the application, such as creating and retrieving certificate data from a Google Sheet.

## Building and Running

This project does not have a traditional build process. It is deployed by hosting the static frontend files and setting up the Google Apps Script backend.

**To run the project, you need to:**

1.  **Set up the Google Sheet and Google Apps Script:** Follow the detailed instructions in the `README.md` file to create the necessary Google Sheet, forms, and deploy the `gas/code.gs` script as a web app.
2.  **Configure the frontend:** Replace the placeholder values for `SCRIPT_URL` and `REGISTRATION_URL` in the HTML files with the URLs from your Google Apps Script and Google Form.
3.  **Deploy the frontend:** Host the HTML, CSS, and assets on a static web hosting service (like Cloudflare Pages or GitHub Pages).

**Key Commands (for Cloudflare Pages deployment):**

The `wrangler.jsonc` file suggests that the project can be deployed using the Cloudflare Wrangler CLI. The following command would likely be used to deploy the site:

```bash
# TODO: Verify the exact deployment command. It might be:
wrangler pages deploy .
```

## Development Conventions

*   **Code Style:** The code is written in a clean and well-commented style. The JavaScript code is embedded directly in the HTML files.
*   **API:** The Google Apps Script backend provides a simple JSON API with the following endpoints:
    *   `?id={certificate_id}`: Retrieves the data for a specific certificate.
    *   `?email={user_email}`: Retrieves all certificates for a given email address.
    *   `?id_hash={user_id_hash}`: Retrieves all certificates for a given user ID hash.
*   **Security:** The system uses a SHA-256 hash of the user's email to create a unique and non-public ID for each participant. This helps to protect the user's privacy.
*   **Error Handling:** The frontend JavaScript code includes basic error handling for API requests.
