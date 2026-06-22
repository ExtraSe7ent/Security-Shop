# Security Shop v2.0

> [!WARNING]
> **Disclaimer:** This project is intended strictly for educational and research purposes (University Course Project). Do not deploy the BASE mode configuration in any production environment or public network. The vulnerabilities contained herein are real and present significant security risks if exposed.

Security Shop is an intentionally vulnerable E-commerce Web Application designed as a Security Lab. Its primary objective is to demonstrate the critical importance of secure coding practices and the "Defense in Depth" architecture in modern web applications. 

The system allows developers and security professionals to analyze and toggle between two architectural paradigms: BASE (vulnerable) and SECURE (protected).

## Live Demonstration
* Frontend Application: https://security-shop-seven.vercel.app/

---

## Architecture & Technology Stack

* Frontend: React + Vite
* Backend: FastAPI (Python), RESTful APIs
* Database: PostgreSQL (accessed via SQLAlchemy 2.0 ORM)
* AI Chatbot: Google Gemini API integration
* External Infrastructure: Express (Node.js) acting as a simulated malicious server for XSS and token exfiltration demonstrations.

---

## Architectural Paradigms

The core mechanism of this application is the ability to instantly switch between two modes to observe how the system handles malicious inputs and adversarial conditions.

### BASE Mode (Intentionally Vulnerable)
In Base Mode, the application deliberately ignores standard security best practices. It inherently trusts client-side input, lacks proper authorization boundaries, and executes direct SQL queries. This mode serves as a practical demonstration of how easily common web vulnerabilities can be exploited when developers fail to implement proper validation and sanitization.

### SECURE Mode (Defense in Depth)
In Secure Mode, the application implements a multi-layered security architecture:
* Layer 1 (Code & Input Validation): Utilizes parameterized ORM queries, enforces strict input length limitations, and applies WAF-style keyword filtering to reject malicious payloads.
* Layer 2 (Business Logic Validation): Implements server-side verification of pricing, stock limitations, and order total caps to prevent business logic abuse.
* Layer 3 (Access Control & IDOR Protection): Replaces sequential identifiers with unpredictable UUIDs and enforces strict ownership verification via JWT `sub` claims.
* Layer 4 (Integrity & Storage): Secures sensitive data at rest using AES-256-CBC encryption (e.g., Credit Card numbers) and guarantees data integrity in transit using HMAC-SHA256 request signing.
* AI Guardrails: Employs rate limiting, XML prompt bounding to prevent prompt injection, and output filtering to sanitize AI responses.

---

## Vulnerabilities Demonstrated

### 1. SQL Injection (SQLi)
* Vulnerability (Base Mode): The product search endpoint utilizes raw SQL string concatenation (`ILIKE '%{q}%'`). An attacker can exploit this via `UNION SELECT` statements to exfiltrate the entire database, including sensitive user credentials and financial records.
* Defense (Secure Mode): Implements SQLAlchemy's ORM parameterized queries, rendering injection impossible. Furthermore, it adds WAF keyword filters and search length limitations as defense-in-depth measures.

### 2. Business Logic Flaw (Price Manipulation)
* Vulnerability (Base Mode): The backend inherently trusts the `price` field transmitted by the client during the checkout process. An attacker can intercept the HTTP request and modify the payload to purchase high-value items for negligible amounts (e.g., $0.01).
* Defense (Secure Mode): The backend completely discards the client-provided `price`. It independently retrieves the authoritative price from the database and calculates subtotals server-side.

### 3. Insecure Direct Object Reference (IDOR)
* Vulnerability (Base Mode): Order records utilize predictable, sequential integers for identifiers. Any authenticated user can manipulate the ID parameter in the URL to access other users' order details, exposing shipping addresses and plaintext credit card numbers.
* Defense (Secure Mode): Replaces sequential IDs with unpredictable UUIDs (`order_uuid`). Additionally, the backend strictly verifies that the `user_id` associated with the order matches the currently authenticated session.

### 4. Broken Data Storage (Plaintext Credit Cards)
* Vulnerability (Base Mode): Credit card numbers are stored in plain text within the database. In the event of a database compromise, the attacker instantly acquires all financial data without requiring decryption.
* Defense (Secure Mode): Credit card numbers are encrypted using `AES-256-CBC` prior to storage. Only the encrypted ciphertext and the last 4 digits (for display purposes) are retained in the database.

### 5. AI Prompt Injection & Data Leakage
* Vulnerability (Base Mode): The integrated AI chatbot is granted unrestricted access to the user's order and payment history context. A malicious product review containing a prompt injection payload can manipulate the AI into executing XSS attacks against the user viewing the review.
* Defense (Secure Mode): Applies strict XML tag bounding to isolate untrusted review content from the system prompt. Incorporates rate limiters and output guardrails (HTML escaping and regex-based redaction) to prevent the generation of malicious scripts or the leakage of sensitive data formats.

### 6. Man in the Middle (MitM) - Order Data Tampering
* Vulnerability (Base Mode): Order creation requests are sent without any integrity verification. An attacker positioned in the middle (or using a proxy tool) can intercept the request and inject fake information, modifying shipping addresses, payment details, or quantities before the request reaches the server.
* Defense (Secure Mode): Implements HMAC-SHA256 request signing. The client generates a cryptographic signature based on the request payload and a shared secret. If an attacker tampers with the data in transit, the signature validation on the backend will fail, and the request will be immediately rejected.

## Environment Variables (.env)
Note: The `.env` file committed to this repository contains dummy values (`XXXXXX`) for security reasons. Before running the application locally, you must replace these placeholder values with your actual database connection string, encryption keys, and Gemini API key.
