Inventory Management System

A simple and practical Inventory Management System built with Node.js and a clean web-based UI.
This project helps track products, stock movements (IN / OUT), and warehouse status in real time.

🚀 Features

📦 Product management (add, view, update, delete)

🔄 Stock movements (IN / OUT)

⚠️ Stock alerts:

Out of stock products

Low stock products (≤ 10)

📊 Dashboard with:

Total products

Total quantity

Warehouse status summary

🌍 i18n-ready structure (multi-language support friendly)

💾 File-based storage using JSON

🎨 Clean and user-friendly UI

🛠 Tech Stack

Backend: Node.js (Express-style structure)

Frontend: HTML, CSS, Vanilla JavaScript

Storage: JSON files (no database required)

Version Control: Git & GitHub

📁 Project Structure
inventory-system/
│
├── data/
│   ├── products.json
│   └── movements.json
│
├── public/
│   ├── app.html
│   ├── styles.css
│   └── i18n.js
│
├── src/
│   ├── services/
│   │   ├── productService.js
│   │   ├── movementService.js
│   │   └── statsService.js
│   ├── routes/
│   └── server.js
│
├── ui-test.js
├── package.json
└── README.md

⚙️ Installation & Run
1️⃣ Clone the repository
git clone https://github.com/labdumannnov/inventory-system.git
cd inventory-system

2️⃣ Install dependencies
npm install

3️⃣ Run the project
node src/server.js

4️⃣ Open in browser
http://localhost:4000

📊 Stock Logic

IN → increases product quantity

OUT → decreases product quantity

Prevents OUT movement if stock is insufficient

Highlights:

🔴 Out of stock

🟡 Low stock (≤ 10)

🎯 Use Case

This project is suitable for:

Small warehouse systems

Learning full-stack basics

Academic projects

Portfolio demonstration

🧪 Testing

Manual UI testing

Input validation for quantity and movement type

Error handling for invalid operations

🌐 Demo

Demo URL will be added after deployment.

👤 Author

Muxriddin
GitHub: 1abdumannonov

📄 License

This project is for educational purposes.
